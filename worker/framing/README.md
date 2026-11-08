# Video Framing & Visual Transformation Strategies (`worker/framing/`)

This directory houses modular strategies for formatting 16:9 horizontal videos into 9:16 vertical reels according to template-defined viewports.

## Responsibilities

Every strategy implements the `FramingStrategy` contract defined in `base.py`, converting source video and viewport geometry into an FFmpeg layout filter graph.

## Files

- `base.py`: Defines `Viewport` geometry (supporting template margins) and `FramingResult`.
- `registry.py`: Declarative registry mapping `framing_mode` names to their strategies without hardcoding branches in the engine.
- `smart_zoom.py`: Computer vision subject tracking (MediaPipe & OpenCV) with smooth dynamic centering that maximizes visible horizontal context based on template margins.
- `blurred_background.py`: Preserves the complete uncropped 16:9 video in the center with blurred ambient expansion on top and bottom.
- `center_crop.py`: Fixed static vertical slice centered on the video.

