"""
Video Cutter & Subtitle Burner
Cuts video snippets, compiles 9:16 vertical framing filter graphs, and burns ASS karaoke subtitles.
System Layer: worker / cutter
"""

import os
import shutil
import subprocess
import imageio_ffmpeg
from typing import Dict, Any

FFMPEG_BIN = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

def render_reel(
    input_video: str,
    start_sec: float,
    end_sec: float,
    ass_path: str,
    output_path: str,
    framing_mode: str = "blurred_background",
    fonts_dir: str = None
) -> None:
    """
    Cuts video segment, applies 9:16 framing (crop or blurred pad), burns ASS subtitles,
    and produces high-resolution vertical MP4.
    """
    duration = end_sec - start_sec
    base_name = os.path.splitext(output_path)[0]
    temp_cut = f"{base_name}_cut.mp4"

    # Normalize subtitle path for FFmpeg filter graph on Windows
    safe_ass = ass_path.replace("\\", "/").replace(":", "\\:")

    # 1. Choose 9:16 vertical layout filter graph
    if framing_mode == "crop":
        # Crop 16:9 to center 9:16 vertical strip
        layout_filter = "scale=-1:1920,crop=1080:1920:(in_w-1080)/2:0"
    else:
        # Default: Sharp centered video with blurred background expansion
        layout_filter = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:5[bg];"
            "[0:v]scale=1080:-1[fg];"
            "[bg][fg]overlay=0:(1920-overlay_h)/2"
        )

    # 2. Step 1: Cut snippet and apply 9:16 framing
    print(f"[cutter] Cutting {start_sec:.2f}s -> {end_sec:.2f}s ({duration:.2f}s) to 9:16 vertical...")
    cut_cmd = [
        FFMPEG_BIN, "-y",
        "-ss", str(start_sec),
        "-t", str(duration),
        "-i", input_video,
    ]

    if framing_mode == "crop":
        cut_cmd.extend(["-vf", layout_filter])
    else:
        cut_cmd.extend(["-filter_complex", layout_filter])

    cut_cmd.extend([
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-c:a", "aac", "-b:a", "192k",
        temp_cut
    ])

    subprocess.run(cut_cmd, check=True)

    # 3. Step 2: Burn ASS karaoke subtitles
    print(f"[cutter] Burning karaoke subtitles from {ass_path}...")
    subtitle_filter = f"subtitles='{safe_ass}'"
    if fonts_dir and os.path.exists(fonts_dir):
        safe_fonts = fonts_dir.replace("\\", "/").replace(":", "\\:")
        subtitle_filter += f":fontsdir='{safe_fonts}'"

    burn_cmd = [
        FFMPEG_BIN, "-y",
        "-i", temp_cut,
        "-vf", subtitle_filter,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-c:a", "copy",
        output_path
    ]

    try:
        subprocess.run(burn_cmd, check=True)
    finally:
        # Clean temporary intermediate cut
        if os.path.exists(temp_cut):
            os.remove(temp_cut)

    print(f"[cutter] Finished rendering reel: {output_path}")

def extract_audio_for_transcription(video_path: str, output_wav: str) -> None:
    """Extracts 16kHz mono PCM audio for fast Whisper transcription."""
    cmd = [
        FFMPEG_BIN, "-y",
        "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        output_wav
    ]
    subprocess.run(cmd, check=True)

