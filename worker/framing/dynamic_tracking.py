"""
Dynamic Subject Tracking Framing Strategy
Tracks the most salient subject in the frame across time (human, group, animal, or object)
using multi-modal visual saliency (MediaPipe face/group clustering, FFT spectral residual,
and temporal motion energy) and compiles smooth, cinematic FFmpeg pan expressions.
System Layer: worker / framing / dynamic_tracking
"""

import os
from typing import List, Tuple, Optional, Any
import numpy as np
from framing.base import Viewport, FramingResult

def detect_frame_salient_x(
    frame: np.ndarray,
    prev_frame_gray: Optional[np.ndarray],
    mp_detector: Optional[Any] = None,
    haar_cascade: Optional[Any] = None
) -> Tuple[Optional[float], Optional[np.ndarray]]:
    """
    Detects the normalized horizontal center (0.0 to 1.0) of the most relevant subject in a single frame.
    Supports:
    1. Human faces and multi-person groups (MediaPipe / Haar cascade group centroid).
    2. Salient non-human subjects (animals, products, objects) via FFT spectral residual.
    3. Active motion energy (frame differencing).
    Returns (salient_x, current_frame_gray).
    """
    import cv2

    h, w = frame.shape[:2]
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    # 1. Human / Group Subject Detection
    detected_faces: List[Tuple[float, float, float, float]] = [] # (cx, cy, width, height)

    if mp_detector:
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = mp_detector.process(rgb_frame)
            if results and results.detections:
                for det in results.detections:
                    box = det.location_data.relative_bounding_box
                    fc_x = box.xmin + (box.width / 2.0)
                    fc_y = box.ymin + (box.height / 2.0)
                    # Ignore corner HUD / scoreboards / logos
                    if not ((fc_x > 0.88 or fc_x < 0.12) and (fc_y < 0.18 or fc_y > 0.85)):
                        detected_faces.append((fc_x, fc_y, box.width, box.height))
        except Exception:
            pass

    if not detected_faces and haar_cascade:
        try:
            faces = haar_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=6, minSize=(60, 60))
            for fx, fy, fw, fh in faces:
                fc_x = (fx + fw / 2.0) / float(w)
                fc_y = (fy + fh / 2.0) / float(h)
                if not ((fc_x > 0.88 or fc_x < 0.12) and (fc_y < 0.18 or fc_y > 0.85)):
                    detected_faces.append((fc_x, fc_y, fw / float(w), fh / float(h)))
        except Exception:
            pass

    # If human subjects exist, center on the active person or group centroid
    if detected_faces:
        if len(detected_faces) == 1:
            return detected_faces[0][0], gray

        # Multi-person group: compute weighted centroid by face area
        total_weight = 0.0
        weighted_x = 0.0
        for fx, fy, fw, fh in detected_faces:
            weight = max(0.001, fw * fh)
            # Center proximity bonus
            weight *= (1.0 - abs(fx - 0.5) * 0.4)
            weighted_x += fx * weight
            total_weight += weight

        if total_weight > 0:
            return (weighted_x / total_weight), gray

    # 2. Non-Human Salient Object & Animal Detection via FFT Spectral Residual
    # Downscale for high-speed spectral analysis (128x72)
    small_w, small_h = 128, 72
    small_gray = cv2.resize(gray, (small_w, small_h))

    f = np.fft.fft2(small_gray)
    mag = np.abs(f)
    log_mag = np.log(mag + 1e-6)
    residual = log_mag - cv2.boxFilter(log_mag, -1, (3, 3))
    sal = np.abs(np.fft.ifft2(np.exp(residual + 1j * np.angle(f)))) ** 2
    sal = cv2.GaussianBlur(sal, (9, 9), 2.5)

    # 3. Motion Energy Integration (if previous frame available)
    if prev_frame_gray is not None:
        prev_small = cv2.resize(prev_frame_gray, (small_w, small_h))
        motion_diff = cv2.absdiff(small_gray, prev_small)
        motion_diff = cv2.GaussianBlur(motion_diff, (7, 7), 2.0).astype(np.float32)
        # Normalize and fuse with spectral saliency
        if motion_diff.max() > 0:
            motion_norm = motion_diff / motion_diff.max()
            sal = sal * 0.6 + motion_norm * 0.4 * (sal.max() or 1.0)

    # Suppress edges (outer 10% margins) to prevent locking on screen borders or watermarks
    edge_mask = np.ones((small_h, small_w), dtype=np.float32)
    margin_x = int(small_w * 0.12)
    margin_y = int(small_h * 0.12)
    edge_mask[:, :margin_x] = 0.2
    edge_mask[:, -margin_x:] = 0.2
    edge_mask[:margin_y, :] = 0.2
    edge_mask[-margin_y:, :] = 0.2
    sal *= edge_mask

    # Find highest salient peak
    _, max_val, _, max_loc = cv2.minMaxLoc(sal)
    if max_val > 1e-4:
        salient_x = max_loc[0] / float(small_w)
        return salient_x, gray

    return None, gray

def track_subject_trajectory(
    video_path: str,
    start_sec: float = 0.0,
    duration_s: Optional[float] = None,
    samples_per_sec: float = 2.5
) -> List[Tuple[float, float]]:
    """
    Extracts timestamped raw subject positions [(t0, x0), (t1, x1), ...] across the clip segment.
    """
    try:
        import cv2
    except ImportError:
        return [(0.0, 0.5)]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return [(0.0, 0.5)]

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    clip_dur = duration_s if (duration_s and duration_s > 0) else (total_frames / fps)

    start_frame = max(0, int(start_sec * fps))
    end_frame = min(total_frames, int((start_sec + clip_dur) * fps))

    # Calculate sampling step
    step_frames = max(1, int(round(fps / samples_per_sec)))

    # Init detectors
    mp_detector = None
    try:
        import mediapipe as mp
        mp_detector = mp.solutions.face_detection.FaceDetection(
            model_selection=1,
            min_detection_confidence=0.55
        )
    except Exception:
        pass

    haar_cascade = None
    if not mp_detector:
        try:
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            if os.path.exists(cascade_path):
                haar_cascade = cv2.CascadeClassifier(cascade_path)
        except Exception:
            pass

    trajectory: List[Tuple[float, float]] = []
    prev_gray = None
    current_frame = start_frame

    while current_frame < end_frame:
        cap.set(cv2.CAP_PROP_POS_FRAMES, current_frame)
        ret, frame = cap.read()
        if not ret or frame is None:
            break

        rel_time = (current_frame - start_frame) / float(fps)
        sal_x, prev_gray = detect_frame_salient_x(
            frame=frame,
            prev_frame_gray=prev_gray,
            mp_detector=mp_detector,
            haar_cascade=haar_cascade
        )

        if sal_x is not None:
            # Cinematic safety bounds clamp to [0.20, 0.80]
            clamped_x = max(0.20, min(0.80, sal_x))
            trajectory.append((rel_time, clamped_x))

        current_frame += step_frames

    cap.release()
    if mp_detector:
        try:
            mp_detector.close()
        except Exception:
            pass

    if not trajectory:
        return [(0.0, 0.5)]

    return trajectory

def smooth_trajectory_keyframes(
    raw_trajectory: List[Tuple[float, float]],
    scaled_w: int,
    target_w: int,
    max_crop_x: int,
    deadband_px: float = 75.0,
    ease_duration_s: float = 0.8
) -> List[Tuple[float, int, bool]]:
    """
    Applies deadband stabilization, S-curve cinematic easing, and instant shot cut handling.
    Returns keyframe milestones: List of (timestamp, crop_x, is_instant_cut).
    """
    if not raw_trajectory:
        return [(0.0, max_crop_x // 2, False)]

    def to_crop_x(norm_x: float) -> int:
        desired_center = norm_x * scaled_w
        raw_x = desired_center - (target_w / 2.0)
        return int(max(0, min(max_crop_x, round(raw_x))))

    keyframes: List[Tuple[float, int, bool]] = []
    current_crop_x = to_crop_x(raw_trajectory[0][1])
    keyframes.append((raw_trajectory[0][0], current_crop_x, False))

    for t, raw_norm_x in raw_trajectory[1:]:
        target_crop_x = to_crop_x(raw_norm_x)
        diff = abs(target_crop_x - current_crop_x)

        # 1. Deadband: ignore micro-movements to avoid jitter
        if diff < deadband_px:
            continue

        # 2. Hard Shot Change Detection: if jump > 35% of scaled width, cut instantly
        is_hard_cut = diff > (scaled_w * 0.35)

        current_crop_x = target_crop_x
        keyframes.append((t, current_crop_x, is_hard_cut))

    return keyframes

def build_smooth_crop_expression(
    keyframes: List[Tuple[float, int, bool]],
    max_crop_x: int,
    duration_s: float,
    ease_duration_s: float = 0.8
) -> str:
    """
    Compiles keyframes into an efficient nested piecewise FFmpeg crop expression.
    Uses smooth S-curve easing between steady states.
    """
    if len(keyframes) <= 1:
        single_x = keyframes[0][1] if keyframes else (max_crop_x // 2)
        return str(single_x)

    # Build expression from back to front for clean nested if(lt(t, T), ...)
    # Fallback default at or beyond final keyframe
    last_x = keyframes[-1][1]
    expr = str(last_x)

    for i in range(len(keyframes) - 2, -1, -1):
        t_curr, x_curr, _ = keyframes[i]
        t_next, x_next, is_cut = keyframes[i + 1]

        if is_cut or (x_curr == x_next):
            # Instant step cut at t_next
            segment = str(x_curr)
        else:
            # Smooth S-curve glide over ease_duration_s
            trans_dur = min(ease_duration_s, max(0.2, t_next - t_curr))
            ease_t = f"(t-{t_curr:.2f})/{trans_dur:.2f}"
            # S-curve smoothstep: 3*s^2 - 2*s^3
            smooth_step = f"(3*pow({ease_t},2)-2*pow({ease_t},3))"
            lerp_val = f"round({x_curr}+({x_next}-{x_curr})*{smooth_step})"
            # Clamp interpolation after transition duration completes
            segment = f"if(lt(t,{t_curr + trans_dur:.2f}),{lerp_val},{x_next})"

        expr = f"if(lt(t,{t_next:.2f}),{segment},{expr})"

    return expr

class DynamicTrackingFraming:
    """
    Dynamic Subject Tracking Framing Strategy.
    Tracks any salient subject (human, group, animal, or object), applies deadband stabilization
    and cinematic S-curve panning in vertical 9:16 reels.
    """
    name = "dynamic_tracking"

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

        scale_ratio = target_h / float(source_height)
        scaled_w = int(round(source_width * scale_ratio))
        max_crop_x = max(0, scaled_w - target_w)

        if max_crop_x == 0:
            # Fits without horizontal crop
            crop_filter = f"scale={target_w}:{target_h},crop={target_w}:{target_h}:0:0"
            desc = "Subject tracking: fitted without crop"
        else:
            # 1. Sample trajectory of salient subject
            raw_trajectory = track_subject_trajectory(
                video_path=video_path,
                start_sec=start_sec,
                duration_s=duration_s,
                samples_per_sec=2.5
            )

            # 2. Apply deadband & S-curve keyframe smoothing
            keyframes = smooth_trajectory_keyframes(
                raw_trajectory=raw_trajectory,
                scaled_w=scaled_w,
                target_w=target_w,
                max_crop_x=max_crop_x,
                deadband_px=scaled_w * 0.05 # 5% deadband window
            )

            # 3. Compile dynamic FFmpeg crop expression
            crop_x_expr = build_smooth_crop_expression(
                keyframes=keyframes,
                max_crop_x=max_crop_x,
                duration_s=duration_s,
                ease_duration_s=0.8
            )

            crop_filter = f"scale=-1:{target_h},crop={target_w}:{target_h}:'{crop_x_expr}':0:exact=1"
            desc = f"Dynamic subject tracking: {len(keyframes)} stabilized keyframes across {duration_s:.1f}s"

        has_margins = (
            viewport.top_margin > 0 or
            viewport.bottom_margin > 0 or
            viewport.left_margin > 0 or
            viewport.right_margin > 0
        )

        if not has_margins and viewport.canvas_width == target_w and viewport.canvas_height == target_h:
            return FramingResult(
                filter_expression=crop_filter,
                is_complex=False,
                description=desc
            )

        filter_expr = (
            f"color=c=black:s={viewport.canvas_width}x{viewport.canvas_height}[base];"
            f"[0:v]{crop_filter}[fg];"
            f"[base][fg]overlay={viewport.left_margin}:{viewport.top_margin}:shortest=1"
        )

        return FramingResult(
            filter_expression=filter_expr,
            is_complex=True,
            description=f"{desc} (viewport margins top={viewport.top_margin}, left={viewport.left_margin})"
        )
