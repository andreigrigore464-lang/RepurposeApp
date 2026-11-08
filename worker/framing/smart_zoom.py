"""
Smart Zoom Framing Strategy
Detects active human subject coordinates using computer vision (MediaPipe / OpenCV)
and dynamically pans/crops to keep the subject in focus within the template's designated viewport.
System Layer: worker / framing / smart_zoom
"""

import os
from typing import List, Tuple, Optional
from framing.base import Viewport, FramingResult

def detect_subject_x_center(
    video_path: str,
    start_sec: float = 0.0,
    duration_s: Optional[float] = None,
    max_samples: int = 15
) -> float:
    """
    Samples frames strictly within the active clip window to detect the dominant subject's horizontal center.
    Returns normalized X coordinate in [0.0, 1.0], where 0.5 is dead center.
    """
    try:
        import cv2
    except ImportError:
        print("[smart_zoom] OpenCV not available, defaulting to center.")
        return 0.5

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return 0.5

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        return 0.5

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    start_frame = max(0, int(start_sec * fps))
    if duration_s and duration_s > 0:
        end_frame = min(total_frames, int((start_sec + duration_s) * fps))
    else:
        end_frame = total_frames

    clip_frames = max(1, end_frame - start_frame)
    step = max(1, clip_frames // max_samples)
    detected_x_positions: List[float] = []

    # Attempt to use MediaPipe Face Detection for modern high-accuracy tracking
    # model_selection=1 is optimized for full-body / distant subjects (up to 5 meters)
    use_mediapipe = False
    mp_detector = None
    try:
        import mediapipe as mp
        mp_detector = mp.solutions.face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=0.6
        )
        use_mediapipe = True
    except Exception:
        # Fallback to OpenCV Haar Cascade if MediaPipe is not installed
        use_mediapipe = False

    # OpenCV Haar cascade fallback
    haar_cascade = None
    if not use_mediapipe:
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            if os.path.exists(cascade_path):
                haar_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            pass

    frame_idx = start_frame
    while frame_idx < end_frame and len(detected_x_positions) < max_samples:
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        h, w = frame.shape[:2]

        if use_mediapipe and mp_detector:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = mp_detector.process(rgb_frame)
            if results and results.detections:
                best_face_x = None
                best_score = -1.0
                for det in results.detections:
                    box = det.location_data.relative_bounding_box
                    face_center_x = box.xmin + (box.width / 2.0)
                    face_center_y = box.ymin + (box.height / 2.0)
                    area = max(0.001, box.width * box.height)

                    # Suppress corner HUD / scoreboard elements (e.g. timer, score, logo)
                    is_corner_hud = (face_center_x > 0.88 or face_center_x < 0.12) and (face_center_y < 0.18 or face_center_y > 0.85)
                    hud_penalty = 0.05 if is_corner_hud else 1.0

                    # Center-proximity score: favor subjects in the active action zone
                    center_dist = abs(face_center_x - 0.5)
                    score = area * (1.0 - center_dist * 0.6) * hud_penalty

                    if score > best_score:
                        best_score = score
                        best_face_x = face_center_x

                if best_face_x is not None:
                    detected_x_positions.append(max(0.0, min(1.0, best_face_x)))

        elif haar_cascade:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            # minNeighbors=6 reduces false positives from text/scoreboard digit boxes
            faces = haar_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=6, minSize=(70, 70))
            if len(faces) > 0:
                best_face_x = None
                best_score = -1.0
                for fx, fy, fw, fh in faces:
                    face_center_x = (fx + fw / 2.0) / float(w)
                    face_center_y = (fy + fh / 2.0) / float(h)
                    area = (fw * fh) / float(w * h)

                    is_corner_hud = (face_center_x > 0.88 or face_center_x < 0.12) and (face_center_y < 0.18 or face_center_y > 0.85)
                    hud_penalty = 0.05 if is_corner_hud else 1.0

                    center_dist = abs(face_center_x - 0.5)
                    score = area * (1.0 - center_dist * 0.6) * hud_penalty

                    if score > best_score:
                        best_score = score
                        best_face_x = face_center_x

                if best_face_x is not None:
                    detected_x_positions.append(max(0.0, min(1.0, best_face_x)))

        frame_idx += step

    cap.release()
    if mp_detector:
        try:
            mp_detector.close()
        except Exception:
            pass

    if not detected_x_positions:
        print("[smart_zoom] No faces detected in sample frames. Defaulting to center (0.5).")
        return 0.5

    # Compute robust median to reject transient outlier detections
    detected_x_positions.sort()
    mid = len(detected_x_positions) // 2
    raw_median_x = detected_x_positions[mid]

    # Cinematic safety bounds: clamp to [0.25, 0.75] to prevent panning onto HUD margins or edge walls
    clamped_x = max(0.25, min(0.75, raw_median_x))
    print(f"[smart_zoom] Detected subject focus at normalized X={clamped_x:.3f} (raw={raw_median_x:.3f}) across {len(detected_x_positions)} sample frames.")
    return clamped_x

class SmartZoomFraming:
    """
    Dynamically centers the active subject in 9:16 vertical reels while respecting
    template-defined viewports (preserving more horizontal space when top/bottom margins are used).
    """
    name = "smart_zoom"

    def build_filter(
        self,
        video_path: str,
        viewport: Viewport,
        source_width: int,
        source_height: int,
        duration_s: float,
        start_sec: float = 0.0
    ) -> FramingResult:
        target_w = viewport.width
        target_h = viewport.height

        # Calculate scaled width when video is scaled to fill viewport height
        scale_ratio = target_h / float(source_height)
        scaled_w = int(round(source_width * scale_ratio))

        # Max allowable horizontal panning offset
        max_crop_x = max(0, scaled_w - target_w)

        if max_crop_x == 0:
            # Video fits horizontally without cropping
            crop_x = 0
            scale_cmd = f"scale={target_w}:{target_h}"
        else:
            # Detect subject's focal center strictly within this clip segment
            norm_x = detect_subject_x_center(
                video_path=video_path,
                start_sec=start_sec,
                duration_s=duration_s,
                max_samples=15
            )

            # Center the crop box on the detected subject
            desired_center = norm_x * scaled_w
            desired_x = desired_center - (target_w / 2.0)
            crop_x = int(max(0, min(max_crop_x, round(desired_x))))

            scale_cmd = f"scale=-1:{target_h}"

        crop_filter = f"{scale_cmd},crop={target_w}:{target_h}:{crop_x}:0"

        # Check if template has margins that require background canvas positioning
        has_margins = (
            viewport.top_margin > 0 or
            viewport.bottom_margin > 0 or
            viewport.left_margin > 0 or
            viewport.right_margin > 0
        )

        if not has_margins and viewport.canvas_width == target_w and viewport.canvas_height == target_h:
            # Clean fullscreen 9:16 filter
            return FramingResult(
                filter_expression=crop_filter,
                is_complex=False,
                description=f"Smart zoom subject-centered crop at X={crop_x} (scaled_w={scaled_w})"
            )

        # Template-aware positioning: Place smart cropped video into designated viewport
        filter_expr = (
            f"color=c=black:s={viewport.canvas_width}x{viewport.canvas_height}[base];"
            f"[0:v]{crop_filter}[fg];"
            f"[base][fg]overlay={viewport.left_margin}:{viewport.top_margin}:shortest=1"
        )

        return FramingResult(
            filter_expression=filter_expr,
            is_complex=True,
            description=f"Smart zoom centered in template viewport (w={target_w}, h={target_h}, crop_x={crop_x})"
        )

