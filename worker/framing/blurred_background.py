"""
Blurred Background Framing Strategy
Keeps original 16:9 frame uncropped with blurred ambient expansion filling the 9:16 vertical canvas.
System Layer: worker / framing / blurred_background
"""

from framing.base import Viewport, FramingResult

class BlurredBackgroundFraming:
    """
    Renders the uncropped source video centered inside the canvas viewport,
    with an enlarged, box-blurred background layer filling the vertical frame.
    """
    name = "blurred_background"

    def build_filter(
        self,
        video_path: str,
        viewport: Viewport,
        source_width: int,
        source_height: int,
        duration_s: float,
        start_sec: float = 0.0
    ) -> FramingResult:
        # 1. Background: scale to cover entire 1080x1920 canvas, crop center, blur
        # 2. Foreground: scale to fit viewport width while maintaining aspect ratio
        fg_w = viewport.width
        fg_x = viewport.left_margin
        
        # Center foreground vertically within the designated viewport height
        # Note: overlay_h is dynamically resolved by FFmpeg
        filter_expr = (
            f"[0:v]scale={viewport.canvas_width}:{viewport.canvas_height}:force_original_aspect_ratio=increase,"
            f"crop={viewport.canvas_width}:{viewport.canvas_height},boxblur=20:5[bg];"
            f"[0:v]scale={fg_w}:-1[fg];"
            f"[bg][fg]overlay={fg_x}:{viewport.top_margin}+({viewport.height}-overlay_h)/2:shortest=1"
        )

        return FramingResult(
            filter_expression=filter_expr,
            is_complex=True,
            description="Blurred ambient background expansion with centered uncropped foreground"
        )

