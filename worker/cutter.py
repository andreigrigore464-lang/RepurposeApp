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

_HAS_NVENC: Optional[bool] = None

def is_nvenc_available() -> bool:
    """
    Probes whether NVIDIA hardware encoding (h264_nvenc) is supported and functional.
    Caches the result after the first check.
    """
    global _HAS_NVENC
    if _HAS_NVENC is not None:
        return _HAS_NVENC

    try:
        # Fast 0.05s probe with nullsrc to confirm driver + GPU capability
        probe = subprocess.run(
            [FFMPEG_BIN, "-v", "error", "-f", "lavfi", "-i", "nullsrc=s=64x64:d=0.05", "-c:v", "h264_nvenc", "-f", "null", "-"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=4
        )
        _HAS_NVENC = (probe.returncode == 0)
    except Exception:
        _HAS_NVENC = False

    if _HAS_NVENC:
        print("[cutter] Hardware acceleration: NVIDIA NVENC (h264_nvenc) active 🚀")
    else:
        print("[cutter] Hardware acceleration: CPU encoding (libx264 -preset veryfast) active.")

    return _HAS_NVENC

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
    Cuts video segment, compiles 9:16 framing, burns ASS karaoke subtitles, and encodes
    directly to the final MP4 in a SINGLE pass using GPU NVENC (or optimized CPU fallback).
    """
    duration = end_sec - start_sec

    # Default to bundled fonts directory if not explicitly provided
    if not fonts_dir:
        default_fonts = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
        if os.path.exists(default_fonts):
            fonts_dir = default_fonts

    # Normalize subtitle and fonts paths for FFmpeg filter graph
    safe_ass = ass_path.replace("\\", "/").replace(":", "\\:")
    subtitle_filter = f"subtitles='{safe_ass}'"
    if fonts_dir and os.path.exists(fonts_dir):
        safe_fonts = fonts_dir.replace("\\", "/").replace(":", "\\:")
        subtitle_filter += f":fontsdir='{safe_fonts}'"

    # 1. Resolve template viewport geometry and framing strategy
    viewport = Viewport.from_dict(viewport_data)
    src_w, src_h = get_video_dimensions(input_video)

    strategy = get_framing_strategy(framing_mode)
    framing_res = strategy.build_filter(
        video_path=input_video,
        viewport=viewport,
        source_width=src_w,
        source_height=src_h,
        duration_s=duration,
        start_sec=start_sec
    )
    print(f"[cutter] Using framing strategy '{strategy.name}': {framing_res.description}")

    # 2. Combine framing and subtitle burning into a SINGLE filter pipeline
    filter_args = []
    if framing_res.is_complex:
        # Complex filter: chain subtitles to the merged foreground/background
        full_complex = f"{framing_res.filter_expression}[framed];[framed]{subtitle_filter}[outv]"
        filter_args = ["-filter_complex", full_complex, "-map", "[outv]", "-map", "0:a?"]
    else:
        # Simple filter: chain directly with comma
        combined_vf = f"{framing_res.filter_expression},{subtitle_filter}"
        filter_args = ["-vf", combined_vf]

    # 3. Select hardware-accelerated NVENC or optimized CPU video encoder
    if is_nvenc_available():
        vcodec_args = [
            "-c:v", "h264_nvenc",
            "-preset", "p4",
            "-cq", "20",
            "-b:v", "8M",
            "-maxrate", "12M",
            "-bufsize", "16M",
            "-pix_fmt", "yuv420p"
        ]
    else:
        vcodec_args = [
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "19",
            "-pix_fmt", "yuv420p"
        ]

    # 4. Execute single-pass render
    print(f"[cutter] Single-pass rendering {start_sec:.2f}s -> {end_sec:.2f}s ({duration:.2f}s) to '{output_path}'...")
    render_cmd = [
        FFMPEG_BIN, "-y",
        "-v", "error",
        "-ss", str(start_sec),
        "-t", str(duration),
        "-i", input_video,
        *filter_args,
        *vcodec_args,
        "-c:a", "aac",
        "-b:a", "192k",
        output_path
    ]

    subprocess.run(render_cmd, check=True)
    print(f"[cutter] Successfully generated reel: {output_path}")

def extract_audio_for_transcription(video_path: str, output_wav: str) -> None:
    """Extracts 16kHz mono PCM audio for fast Whisper transcription."""
    cmd = [
        FFMPEG_BIN, "-y",
        "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        output_wav
    ]
    subprocess.run(cmd, check=True)

