"""
Video Processing Pipeline Action
Coordinates downloading source media, Whisper transcription, hook selection, FFmpeg rendering,
R2 upload, and Supabase format output creation.
System Layer: worker / pipeline
"""

import os
import shutil
import tempfile
import soundfile as sf
from faster_whisper import WhisperModel
import yt_dlp

from config import get_supabase_client, get_r2_client, R2_BUCKET_NAME, DEFAULT_DEVICE, DEFAULT_COMPUTE_TYPE, GEMINI_API_KEY
from subtitles import group_words_into_phrases, generate_ass, generate_srt, hex_to_ass_color, parse_time_to_seconds
from hook_selector import select_hooks_with_llm
from cutter import render_reel, extract_audio_for_transcription

def run_job_pipeline(job: dict, on_progress=None):
    """
    Executes the full video repurposing pipeline for a single queued job.
    """
    supabase = get_supabase_client()
    r2 = get_r2_client()

    job_id = job["id"]
    article_id = job["article_id"]
    brand_id = job["brand_id"]
    config = job.get("config_json", {})

    source_type = config.get("source_type", "youtube")
    video_url = config.get("video_url") or config.get("canonical_url")
    clips_count = config.get("clips_count", 3)
    target_duration = config.get("target_duration", "30-60")
    language = config.get("language")
    vocab_hint = config.get("vocabulary_hint")
    manual_timestamps = config.get("manual_timestamps")

    # Template styling extraction
    template_config = config.get("template_config", {})
    font_name = template_config.get("font_name", "Anton")
    font_size = template_config.get("font_size", 92)
    color_primary = hex_to_ass_color(template_config.get("primary_color", "#BDDF3C"))
    color_highlight = hex_to_ass_color(template_config.get("highlight_color", "#FFFFFF"))
    framing_mode = template_config.get("framing_mode", "blurred_background")

    temp_dir = tempfile.mkdtemp(prefix=f"repurpose_{job_id[:8]}_")
    raw_video_path = os.path.join(temp_dir, "source_video.mp4")
    wav_path = os.path.join(temp_dir, "audio.wav")

    try:
        # ==========================================
        # 1. DOWNLOAD SOURCE MEDIA
        # ==========================================
        if on_progress:
            on_progress(status="transcribing", progress_pct=10, stage="Downloading source video...")

        if source_type == "youtube":
            print(f"[pipeline] Downloading YouTube video from {video_url}...")
            ydl_opts = {
                "format": "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]/best",
                "outtmpl": raw_video_path,
                "quiet": True,
                "no_warnings": True,
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
        else:
            # Download directly from Cloudflare R2 using storage key
            print(f"[pipeline] Downloading raw upload from R2: key='{video_url}'...")
            r2.download_file(R2_BUCKET_NAME, video_url, raw_video_path)

        # ==========================================
        # 2. AUDIO EXTRACTION & TRANSCRIPTION
        # ==========================================
        if on_progress:
            on_progress(status="transcribing", progress_pct=25, stage="Extracting audio & transcribing speech...")

        extract_audio_for_transcription(raw_video_path, wav_path)

        whisper_model_name = "medium" if DEFAULT_DEVICE == "cuda" else "base"
        print(f"[pipeline] Loading Whisper model '{whisper_model_name}' on {DEFAULT_DEVICE} ({DEFAULT_COMPUTE_TYPE})...")
        model = WhisperModel(whisper_model_name, device=DEFAULT_DEVICE, compute_type=DEFAULT_COMPUTE_TYPE)

        audio_data, sr = sf.read(wav_path)
        segments_gen, info = model.transcribe(
            audio_data,
            language=language or None,
            initial_prompt=vocab_hint or None,
            word_timestamps=True
        )

        all_words = []
        segments = []
        for seg in segments_gen:
            segments.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text,
            })
            for w in seg.words:
                all_words.append({
                    "word": w.word,
                    "start": w.start,
                    "end": w.end,
                })

        print(f"[pipeline] Transcription complete: {len(segments)} sentences, {len(all_words)} words.")

        # Update article clean_text with full transcript
        full_transcript = " ".join(s["text"].strip() for s in segments)
        supabase.table("articles").update({"clean_text": full_transcript}).eq("id", article_id).execute()

        # ==========================================
        # 3. HOOK & CLIP SELECTION
        # ==========================================
        if on_progress:
            on_progress(status="selecting_hooks", progress_pct=50, stage="Detecting viral narrative hooks...")

        selected_clips = []
        if manual_timestamps and len(manual_timestamps) > 0:
            for idx, ts in enumerate(manual_timestamps):
                s_sec = parse_time_to_seconds(ts["start"])
                e_sec = parse_time_to_seconds(ts["end"])
                selected_clips.append({
                    "reel_index": idx + 1,
                    "hook_sentence": f"Clip #{idx + 1}",
                    "start_seconds": s_sec,
                    "end_seconds": e_sec,
                    "topic": f"Manual Clip #{idx + 1}"
                })
        else:
            selected_clips = select_hooks_with_llm(
                segments=segments,
                clips_count=clips_count,
                target_duration=target_duration,
                gemini_api_key=GEMINI_API_KEY
            )

        print(f"[pipeline] Selected {len(selected_clips)} hook clips.")

        # ==========================================
        # 4. RENDER REELS & UPLOAD TO R2
        # ==========================================
        generated_formats = []
        total_clips = len(selected_clips)

        for i, clip in enumerate(selected_clips):
            reel_idx = i + 1
            pct = 60 + int((i / total_clips) * 30)
            if on_progress:
                on_progress(status="rendering", progress_pct=pct, stage=f"Rendering Reel #{reel_idx} with karaoke subtitles...")

            start_s = float(clip["start_seconds"])
            end_s = float(clip["end_seconds"])
            duration_s = round(end_s - start_s, 1)

            # Filter words falling inside this snippet window and re-zero start times
            clip_words = []
            for w in all_words:
                if w["start"] >= start_s and w["end"] <= end_s:
                    clip_words.append({
                        "word": w["word"],
                        "start": max(0.0, w["start"] - start_s),
                        "end": max(0.0, w["end"] - start_s),
                    })

            # Subtitles content
            phrases = group_words_into_phrases(clip_words, max_words=4, max_gap=0.5)
            ass_content = generate_ass(
                phrases,
                font_name=font_name,
                font_size=font_size,
                color_primary=color_primary,
                color_highlight=color_highlight,
            )
            srt_content = generate_srt(phrases)

            ass_path = os.path.join(temp_dir, f"reel_{reel_idx}.ass")
            with open(ass_path, "w", encoding="utf-8") as f:
                f.write(ass_content)

            output_mp4 = os.path.join(temp_dir, f"reel_{reel_idx}.mp4")
            render_reel(
                input_video=raw_video_path,
                start_sec=start_s,
                end_sec=end_s,
                ass_path=ass_path,
                output_path=output_mp4,
                framing_mode=framing_mode,
            )

            # Upload rendered MP4 to R2
            r2_key = f"reels/{job_id}/reel_{reel_idx}.mp4"
            print(f"[pipeline] Uploading Reel #{reel_idx} to R2: '{r2_key}'...")
            r2.upload_file(output_mp4, R2_BUCKET_NAME, r2_key, ExtraArgs={"ContentType": "video/mp4"})

            # Generate presigned download URL
            public_video_url = r2.generate_presigned_url(
                "get_object",
                Params={"Bucket": R2_BUCKET_NAME, "Key": r2_key},
                ExpiresIn=604800 # 7 days
            )

            # Insert into format_outputs table
            slots_data = {
                "reel_index": reel_idx,
                "video_url": public_video_url,
                "storage_key": r2_key,
                "duration_seconds": duration_s,
                "aspect_ratio": "9:16",
                "start_timestamp": f"{int(start_s // 60):02d}:{int(start_s % 60):02d}",
                "end_timestamp": f"{int(end_s // 60):02d}:{int(end_s % 60):02d}",
                "hook_text": clip.get("hook_sentence", ""),
                "srt_content": srt_content,
            }

            res = supabase.table("format_outputs").insert({
                "brand_id": brand_id,
                "article_id": article_id,
                "format_kind": "video-reel",
                "slots_data": slots_data,
                "status": "drafted",
            }).execute()

            if res.data and len(res.data) > 0:
                generated_formats.append(res.data[0])

        # ==========================================
        # 5. EPHEMERAL CLEANUP OF RAW SOURCE MEDIA
        # ==========================================
        if source_type == "video_upload":
            print(f"[pipeline] Ephemeral rule: deleting raw source upload '{video_url}' from R2 to save storage...")
            try:
                r2.delete_object(Bucket=R2_BUCKET_NAME, Key=video_url)
            except Exception as del_err:
                print(f"[pipeline] Warning: could not delete raw R2 media: {del_err}")

        if on_progress:
            on_progress(status="completed", progress_pct=100, stage="All vertical promo reels generated successfully!")

        return generated_formats

    finally:
        # Remove temporary directory from disk
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)

