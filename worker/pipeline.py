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
from concurrent.futures import ThreadPoolExecutor, as_completed
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
    framing_mode = template_config.get("framing_mode") or config.get("framing_mode", "smart_zoom")
    viewport_data = template_config.get("viewport") or config.get("viewport")

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
                "quiet": False,
                "no_warnings": False,
                "extractor_args": {
                    "youtube": {
                        "player_client": ["android", "ios"]
                    }
                }
            }

            # Check for YouTube cookies file (to bypass Colab datacenter bot challenges)
            cookie_candidates = [
                os.environ.get("YOUTUBE_COOKIES_PATH"),
                "/content/cookies.txt",
                "/content/RepurposeApp/worker/cookies.txt",
                "cookies.txt",
                "../cookies.txt",
            ]
            for cp in cookie_candidates:
                if cp and os.path.exists(cp):
                    print(f"[pipeline] Authenticating yt-dlp with cookies from '{cp}'...")
                    ydl_opts["cookiefile"] = cp
                    break

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([video_url])
        else:
            # Download directly from Cloudflare R2 using storage key
            print(f"[pipeline] Downloading raw upload from R2: key='{video_url}'...")
            r2.download_file(R2_BUCKET_NAME, video_url, raw_video_path)

        # ==========================================
        # 2. AUDIO EXTRACTION & TRANSCRIPTION SETUP
        # ==========================================
        if on_progress:
            on_progress(status="transcribing", progress_pct=25, stage="Extracting audio for rapid transcription...")

        extract_audio_for_transcription(raw_video_path, wav_path)

        audio_data, sr = sf.read(wav_path)
        total_audio_s = len(audio_data) / sr

        # Load Whisper model once (using 'base' for blistering ~60x real-time speed)
        whisper_model_name = "base"
        print(f"[pipeline] Loading Whisper model '{whisper_model_name}' on {DEFAULT_DEVICE} ({DEFAULT_COMPUTE_TYPE})...")
        try:
            model = WhisperModel(whisper_model_name, device=DEFAULT_DEVICE, compute_type=DEFAULT_COMPUTE_TYPE)
        except Exception as e:
            if DEFAULT_DEVICE == "cuda":
                print(f"[pipeline] GPU initialization error ({e}). Falling back to CPU...")
                model = WhisperModel("base", device="cpu", compute_type="int8")
            else:
                raise e

        # ==========================================
        # 3. HOOK & CLIP SELECTION (TWO-PASS ARCHITECTURE)
        # ==========================================
        selected_clips = []
        if manual_timestamps and len(manual_timestamps) > 0:
            print(f"[pipeline] Manual timestamps provided: skipping full audio scout pass.")
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
            # Pass 1: Fast Scout Transcription (Full audio, beam_size=1, NO word timestamps)
            if on_progress:
                on_progress(status="transcribing", progress_pct=35, stage=f"Rapid scout transcription ({int(total_audio_s // 60)}m audio)...")

            print(f"[pipeline] Pass 1 (Fast Scout): Scanning full {total_audio_s:.1f}s audio at ~60x speed...")
            segments = []
            try:
                scout_gen, _ = model.transcribe(
                    audio_data,
                    language=language or None,
                    initial_prompt=vocab_hint or None,
                    word_timestamps=False,
                    beam_size=1
                )
                for seg in scout_gen:
                    segments.append({
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text,
                    })
            except Exception as e:
                print(f"[pipeline] Scout pass GPU error ({e}). Retrying on CPU...")
                model = WhisperModel("base", device="cpu", compute_type="int8")
                scout_gen, _ = model.transcribe(
                    audio_data,
                    language=language or None,
                    initial_prompt=vocab_hint or None,
                    word_timestamps=False,
                    beam_size=1
                )
                for seg in scout_gen:
                    segments.append({
                        "start": seg.start,
                        "end": seg.end,
                        "text": seg.text,
                    })

            print(f"[pipeline] Scout pass complete: {len(segments)} sentences found.")

            # Update article clean_text with full transcript
            full_transcript = " ".join(s["text"].strip() for s in segments)
            supabase.table("articles").update({"clean_text": full_transcript}).eq("id", article_id).execute()

            # Select hooks using Gemini
            if on_progress:
                on_progress(status="selecting_hooks", progress_pct=50, stage="Detecting viral narrative hooks...")

            selected_clips = select_hooks_with_llm(
                segments=segments,
                clips_count=clips_count,
                target_duration=target_duration,
                gemini_api_key=GEMINI_API_KEY
            )

        print(f"[pipeline] Selected {len(selected_clips)} hook clips.")

        # ==========================================
        # 4. RENDER REELS (CONCURRENT SINGLE-PASS)
        # ==========================================
        total_clips = len(selected_clips)
        render_tasks = []

        # 4a. Precision word timings and subtitle compilation (Pass 2)
        for i, clip in enumerate(selected_clips):
            reel_idx = i + 1
            start_s = float(clip["start_seconds"])
            end_s = float(clip["end_seconds"])
            duration_s = round(end_s - start_s, 1)

            print(f"[pipeline] Pass 2: Calculating word timings for Reel #{reel_idx} ({duration_s}s)...")
            start_sample = int(start_s * sr)
            end_sample = min(len(audio_data), int(end_s * sr))
            snippet_audio = audio_data[start_sample:end_sample]

            clip_words = []
            try:
                clip_gen, _ = model.transcribe(
                    snippet_audio,
                    language=language or None,
                    initial_prompt=vocab_hint or None,
                    word_timestamps=True,
                    beam_size=3
                )
                for seg in clip_gen:
                    for w in (seg.words or []):
                        clip_words.append({
                            "word": w.word,
                            "start": max(0.0, float(w.start)),
                            "end": max(0.0, float(w.end)),
                        })
            except Exception as e:
                print(f"[pipeline] Warning: precision clip transcription error ({e}), falling back to rough timing.")
                clip_words = [{
                    "word": clip.get("hook_sentence", "Clip"),
                    "start": 0.0,
                    "end": duration_s
                }]

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
            r2_key = f"reels/{job_id}/reel_{reel_idx}.mp4"

            render_tasks.append({
                "reel_idx": reel_idx,
                "start_s": start_s,
                "end_s": end_s,
                "duration_s": duration_s,
                "ass_path": ass_path,
                "output_mp4": output_mp4,
                "r2_key": r2_key,
                "srt_content": srt_content,
                "hook_sentence": clip.get("hook_sentence", ""),
            })

        # 4b. Concurrent Single-Pass Rendering & R2 Upload
        def process_reel(task: dict):
            idx = task["reel_idx"]
            print(f"[pipeline] Starting concurrent render & upload for Reel #{idx}...")
            render_reel(
                input_video=raw_video_path,
                start_sec=task["start_s"],
                end_sec=task["end_s"],
                ass_path=task["ass_path"],
                output_path=task["output_mp4"],
                framing_mode=framing_mode,
                viewport_data=viewport_data,
            )

            # Upload rendered MP4 to R2
            print(f"[pipeline] Uploading Reel #{idx} to R2: '{task['r2_key']}'...")
            r2.upload_file(task["output_mp4"], R2_BUCKET_NAME, task["r2_key"], ExtraArgs={"ContentType": "video/mp4"})

            # Generate presigned download URL
            public_video_url = r2.generate_presigned_url(
                "get_object",
                Params={"Bucket": R2_BUCKET_NAME, "Key": task["r2_key"]},
                ExpiresIn=604800 # 7 days
            )

            # Insert into format_outputs table
            slots_data = {
                "reel_index": idx,
                "video_url": public_video_url,
                "storage_key": task["r2_key"],
                "duration_seconds": task["duration_s"],
                "aspect_ratio": "9:16",
                "start_timestamp": f"{int(task['start_s'] // 60):02d}:{int(task['start_s'] % 60):02d}",
                "end_timestamp": f"{int(task['end_s'] // 60):02d}:{int(task['end_s'] % 60):02d}",
                "hook_text": task["hook_sentence"],
                "srt_content": task["srt_content"],
            }

            res = supabase.table("format_outputs").insert({
                "brand_id": brand_id,
                "article_id": article_id,
                "format_kind": "video-reel",
                "slots_data": slots_data,
                "status": "draft",
            }).execute()

            if res.data and len(res.data) > 0:
                return res.data[0]
            return None

        generated_formats = []
        max_workers = min(3, len(render_tasks)) or 1
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_task = {executor.submit(process_reel, t): t for t in render_tasks}
            completed_count = 0
            for future in as_completed(future_to_task):
                completed_count += 1
                task = future_to_task[future]
                try:
                    format_record = future.result()
                    if format_record:
                        generated_formats.append(format_record)
                    pct = 65 + int((completed_count / len(render_tasks)) * 25)
                    if on_progress:
                        on_progress(status="rendering", progress_pct=pct, stage=f"Completed Reel #{task['reel_idx']} ({completed_count}/{len(render_tasks)})")
                except Exception as exc:
                    print(f"[pipeline] Error rendering Reel #{task['reel_idx']}: {exc}")
                    raise exc

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

