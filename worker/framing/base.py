"""
Framing Base Contracts & Viewport Geometry
Defines viewport bounding geometry and the abstract FramingStrategy protocol.
System Layer: worker / framing / base
"""

from dataclasses import dataclass
from typing import Protocol, Dict, Any, Optional

@dataclass
class Viewport:
    """
    Specifies where the video frame is positioned within the 1080x1920 canvas.
    Enables templates to reserve top/bottom margins for headlines, progress bars, and captions.
    """
    canvas_width: int = 1080
    canvas_height: int = 1920
    top_margin: int = 0
    bottom_margin: int = 0
    left_margin: int = 0
    right_margin: int = 0

    @property
    def width(self) -> int:
        """Visible horizontal width for the active video content."""
        return max(100, self.canvas_width - self.left_margin - self.right_margin)

    @property
    def height(self) -> int:
        """Visible vertical height for the active video content."""
        return max(100, self.canvas_height - self.top_margin - self.bottom_margin)

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]] = None) -> "Viewport":
        """Builds a Viewport from a template configuration dictionary."""
        if not data:
            return cls()
        return cls(
            canvas_width=int(data.get("canvas_width", 1080)),
            canvas_height=int(data.get("canvas_height", 1920)),
            top_margin=int(data.get("top_margin", data.get("top", 0))),
            bottom_margin=int(data.get("bottom_margin", data.get("bottom", 0))),
            left_margin=int(data.get("left_margin", data.get("left", 0))),
            right_margin=int(data.get("right_margin", data.get("right", 0))),
        )

@dataclass
class FramingResult:
    """
    Compiled FFmpeg filter graph for applying 9:16 layout formatting.
    """
    filter_expression: str
    is_complex: bool
    description: str

class FramingStrategy(Protocol):
    """
    Contract for pluggable 9:16 video framing strategies.
    """
    name: str

    def build_filter(
        self,
        video_path: str,
        viewport: Viewport,
        source_width: int,
        source_height: int,
        duration_s: float,
        start_sec: float = 0.0
    ) -> FramingResult:
        """Compiles the layout filter expression for the specified video and viewport."""
        ...

