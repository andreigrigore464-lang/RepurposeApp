"""
Audio Energy & Dynamic Peak Detection
Computes RMS volume profiles across audio to identify peak emotional/vocal moments.
System Layer: worker / audio_energy
"""

import numpy as np
from typing import List, Dict, Any

def compute_audio_energy_peaks(
    audio_data: np.ndarray,
    sr: int,
    window_sec: float = 1.0,
    top_percentile: float = 80.0
) -> List[Dict[str, float]]:
    """
    Computes RMS volume in sliding windows, finds dynamic audio peaks
    (volume escalation, laughter, excitement, exclamations), and returns merged peak intervals.
    """
    if len(audio_data) == 0 or sr <= 0:
        return []

    # If stereo, average to mono
    if audio_data.ndim > 1:
        samples = np.mean(audio_data, axis=1)
    else:
        samples = audio_data

    samples_per_window = int(window_sec * sr)
    total_samples = len(samples)
    if total_samples < samples_per_window:
        return []

    num_windows = total_samples // samples_per_window
    rms_values = np.zeros(num_windows, dtype=np.float32)

    for i in range(num_windows):
        start = i * samples_per_window
        end = start + samples_per_window
        chunk = samples[start:end]
        rms_values[i] = np.sqrt(np.mean(chunk**2))

    # Calculate threshold for top percentile
    threshold = np.percentile(rms_values, top_percentile)
    if threshold <= 0:
        threshold = 1e-4

    # Find peak intervals
    peak_windows = np.where(rms_values >= threshold)[0]
    if len(peak_windows) == 0:
        return []

    intervals = []
    start_w = peak_windows[0]
    prev_w = peak_windows[0]

    for w in peak_windows[1:]:
        # If consecutive or with gap <= 1 window, merge
        if w - prev_w <= 2:
            prev_w = w
        else:
            intervals.append({
                "start": float(round(start_w * window_sec, 2)),
                "end": float(round((prev_w + 1) * window_sec, 2)),
            })
            start_w = w
            prev_w = w

    intervals.append({
        "start": float(round(start_w * window_sec, 2)),
        "end": float(round((prev_w + 1) * window_sec, 2)),
    })

    return intervals

def is_timestamp_in_peaks(start: float, end: float, peaks: List[Dict[str, float]]) -> bool:
    """
    Checks if a segment overlaps with any detected audio peak.
    """
    for p in peaks:
        if max(start, p["start"]) < min(end, p["end"]):
            return True
    return False
