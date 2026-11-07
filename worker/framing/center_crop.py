"""
Center Crop Framing Strategy
Crops a fixed static vertical slice down the center of the video to fill the viewport.
System Layer: worker / framing / center_crop
"""

from framing.base import Viewport, FramingResult

class CenterCropFraming:
    """
    Scales the video up to cover the designated viewport height, then crops a centered
    horizontal window matching the viewport width.
    """
    name = "center_crop"

    def build_filter(
        self,
        video_path: str,
        viewport: Viewport,
        source_width: int,
        source_height: int,
        duration_s: float
    ) -> FramingResult:
        # Scale video so its height matches the viewport height
        target_h = viewport.height
        target_w = viewport.width

        if viewport.top_margin == 0 and viewport.bottom_margin == 0 and viewport.left_margin == 0 and viewport.right_margin == 0:
            # Fullscreen 1080x1920 edge-to-edge simple filter
            filter_expr = f"scale=-1:{target_h},crop={target_w}:{target_h}:(in_w-{target_w})/2:0"
            return FramingResult(
                filter_expression=filter_expr,
                is_complex=False,
                description="Direct static center crop to 1080x1920"
            )

        # Template-constrained viewport: place cropped video on canvas
        filter_expr = (
            f"color=c=black:s={viewport.canvas_width}x{viewport.canvas_height}[base];"
            f"[0:v]scale=-1:{target_h},crop={target_w}:{target_h}:(in_w-{target_w})/2:0[fg];"
            f"[base][fg]overlay={viewport.left_margin}:{viewport.top_margin}"
        )

        return FramingResult(
            filter_expression=filter_expr,
            is_complex=True,
            description="Static center crop positioned inside template viewport"
        )
