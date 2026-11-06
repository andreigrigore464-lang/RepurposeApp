"""
AI Hook Selection
Analyzes timestamped speech transcripts to select complete-thought viral narrative climaxes.
System Layer: worker / hook_selector
"""

import json
import os
from typing import List, Dict, Any

def select_hooks_with_llm(
    segments: List[Dict[str, Any]],
    clips_count: int = 3,
    target_duration: str = "30-60",
    gemini_api_key: str = None
) -> List[Dict[str, Any]]:
    """
    Prompts Gemini to select the most engaging, self-contained complete-thought hooks.
    """
    api_key = gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return select_hooks_heuristic(segments, clips_count, target_duration)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        dur_parts = target_duration.split("-")
        min_sec = int(dur_parts[0]) if len(dur_parts) > 0 else 30
        max_sec = int(dur_parts[1]) if len(dur_parts) > 1 else 60

        # Build compact transcript text with timestamps
        lines = []
        for s in segments:
            lines.append(f"[{s['start']:.1f}s - {s['end']:.1f}s]: {s['text'].strip()}")
        transcript_sample = "\n".join(lines[:350])  # Cap tokens

        prompt = f"""You are an elite vertical video editor and viral hook detector.
Analyze this timestamped podcast/video transcript and select the top {clips_count} distinct clips for 9:16 short vertical reels (TikTok, YouTube Shorts, Instagram Reels).

Target Duration: {min_sec} to {max_sec} seconds per clip (soft guide).

CRITICAL CONSTRAINTS:
1. COMPLETE THOUGHTS ONLY: The clip MUST start with a strong provocative or emotional opening sentence, and MUST resolve the argument or punchline completely. NEVER cut mid-sentence.
2. Distinct moments: Each clip must cover a completely different topic or moment in the video.
3. Accurate timestamps: Start and end timestamps must exactly match the start of the first sentence and the end of the concluding sentence.

Transcript:
{transcript_sample}

Respond ONLY with valid JSON in this exact structure:
[
  {{
    "reel_index": 1,
    "hook_sentence": "The memorable opening sentence that hooks the viewer",
    "start_seconds": 64.2,
    "end_seconds": 105.8,
    "topic": "Short descriptive topic label"
  }}
]
"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        clips_data = json.loads(response.text)
        if isinstance(clips_data, list) and len(clips_data) > 0:
            return clips_data[:clips_count]

    except Exception as e:
        print(f"[hook_selector] LLM selection failed ({e}). Falling back to heuristic selection.")

    return select_hooks_heuristic(segments, clips_count, target_duration)

def select_hooks_heuristic(
    segments: List[Dict[str, Any]],
    clips_count: int = 3,
    target_duration: str = "30-60"
) -> List[Dict[str, Any]]:
    """
    Rule-based fallback: extracts evenly spaced, complete-sentence conversational blocks.
    """
    if not segments:
        return []

    dur_parts = target_duration.split("-")
    min_sec = int(dur_parts[0]) if len(dur_parts) > 0 else 30
    max_sec = int(dur_parts[1]) if len(dur_parts) > 1 else 60
    target_len = (min_sec + max_sec) / 2

    total_duration = segments[-1]["end"] - segments[0]["start"]
    if total_duration < min_sec:
        return [{
            "reel_index": 1,
            "hook_sentence": segments[0]["text"].strip(),
            "start_seconds": segments[0]["start"],
            "end_seconds": segments[-1]["end"],
            "topic": "Highlight Clip"
        }]

    clips = []
    step = total_duration / (clips_count + 1)

    for i in range(clips_count):
        target_center = segments[0]["start"] + step * (i + 1)
        
        # Find start segment near target center
        start_seg = min(segments, key=lambda s: abs(s["start"] - (target_center - target_len / 2)))
        start_idx = segments.index(start_seg)

        # Accumulate forward until reaching target duration
        cur_end = start_seg["end"]
        end_idx = start_idx
        for j in range(start_idx, len(segments)):
            dur = segments[j]["end"] - start_seg["start"]
            if dur >= min_sec:
                end_idx = j
                cur_end = segments[j]["end"]
                if dur >= target_len:
                    break

        clips.append({
            "reel_index": i + 1,
            "hook_sentence": start_seg["text"].strip(),
            "start_seconds": start_seg["start"],
            "end_seconds": cur_end,
            "topic": f"Highlight #{i + 1}"
        })

    return clips

