"""
Video Cutter & Subtitle Burner
Cuts video snippets, compiles 9:16 vertical framing filter graphs, and burns ASS karaoke subtitles.
System Layer: worker / cutter
"""

import os
import shutil
import subprocess
import imageio_ffmpeg
from typing import Dict, Any, Optional, Tuple
from framing.base import Viewport
from framing.registry import get_framing_strategy

FFMPEG_BIN = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()

def get_video_dimensions(video_path: str) -> Tuple[int, int]:
    """Returns (width, height) of the video file using OpenCV or fallback."""
    try:
        import cv2
        cap = cv2.VideoCapture(video_path)
        if cap.isOpened():
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            if w > 0 and h > 0:
                return (w, h)
    except Exception:
        pass
    return (1920, 1080)

def render_reel(
    input_video: str,
    start_sec: float,
    end_sec: float,
    ass_path: str,
    output_path: str,
    framing_mode: str = "smart_zoom",
    viewport_data: Optional[Dict[str, Any]] = None,
    fonts_dir: Optional[str] = None
) -> None:
    """
    Cuts video segment, applies modular 9:16 framing strategy (smart zoom, blurred pad, crop),
    burns ASS subtitles, and produces high-resolution vertical MP4.
    """
    duration = end_sec - start_sec
    base_name = os.path.splitext(output_path)[0]
    temp_cut = f"{base_name}_cut.mp4"

    # Default to bundled fonts directory if not explicitly provided
    if not fonts_dir:
        default_fonts = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
        if os.path.exists(default_fonts):
            fonts_dir = default_fonts

    # Normalize subtitle path for FFmpeg filter graph on Windows
    safe_ass = ass_path.replace("\\", "/").replace(":", "\\:")

    # 1. Resolve template viewport geometry and framing strategy
    viewport = Viewport.from_dict(viewport_data)
    src_w, src_h = get_video_dimensions(input_video)

    strategy = get_framing_strategy(framing_mode)
    framing_res = strategy.build_filter(
        video_path=input_video,
        viewport=viewport,
        source_width=src_w,
        source_height=src_h,
        duration_s=duration
    )
    print(f"[cutter] Using framing strategy '{strategy.name}': {framing_res.description}")

    # 2. Step 1: Cut snippet and apply 9:16 framing
    print(f"[cutter] Cutting {start_sec:.2f}s -> {end_sec:.2f}s ({duration:.2f}s) to 9:16 vertical...")
    cut_cmd = [
        FFMPEG_BIN, "-y",
        "-v", "error",
        "-ss", str(start_sec),
        "-t", str(duration),
        "-i", input_video,
    ]

    if framing_res.is_complex:
        cut_cmd.extend(["-filter_complex", framing_res.filter_expression])
    else:
        cut_cmd.extend(["-vf", framing_res.filter_expression])

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
        "-v", "error",
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

