"""
AI Hook Selection & Cinematic Reel Director
Analyzes timestamped speech transcripts, audio energy peaks, and channel feedback
to select complete-thought 3-act viral narrative climaxes for 9:16 vertical reels.
System Layer: worker / hook_selector
"""

import json
import os
from typing import List, Dict, Any, Optional

def select_hooks_with_llm(
    segments: List[Dict[str, Any]],
    clips_count: int = 3,
    target_duration: str = "30-60",
    gemini_api_key: Optional[str] = None,
    audio_peaks: Optional[List[Dict[str, float]]] = None,
    channel_feedback: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Prompts Gemini to select the most engaging, self-contained complete-thought hooks
    using a 3-act cinematic short-form director persona.
    """
    api_key = gemini_api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return select_hooks_heuristic(segments, clips_count, target_duration, audio_peaks)

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        dur_parts = target_duration.split("-")
        min_sec = int(dur_parts[0]) if len(dur_parts) > 0 else 30
        max_sec = int(dur_parts[1]) if len(dur_parts) > 1 else 60

        # Build transcript lines annotated with audio energy peaks
        from audio_energy import is_timestamp_in_peaks

        peaks = audio_peaks or []
        lines = []
        for s in segments:
            has_peak = is_timestamp_in_peaks(s["start"], s["end"], peaks)
            tag = " 🔥 [HIGH ENERGY]" if has_peak else ""
            lines.append(f"[{s['start']:.1f}s - {s['end']:.1f}s]{tag}: {s['text'].strip()}")

        # Gemini 2.5 Flash easily handles full long-form transcripts (up to 1,200 sentences)
        transcript_text = "\n".join(lines[:1200])

        # Format past channel feedback if present
        feedback_prompt_section = ""
        if channel_feedback and len(channel_feedback) > 0:
            recent_feedback = channel_feedback[-8:] # Up to last 8 feedback entries
            notes = []
            for fb in recent_feedback:
                rating_str = "EXCELLENT / APPROVED" if fb.get("rating") in ["good", "yes"] else "REJECTED / NEEDS WORK"
                comment = fb.get("comment", "").strip()
                hook = fb.get("hookText", "").strip()
                if comment or hook:
                    detail = f"- [{rating_str}]"
                    if hook:
                        detail += f" Hook was: \"{hook}\"."
                    if comment:
                        detail += f" Note: \"{comment}\""
                    notes.append(detail)

            if notes:
                feedback_prompt_section = (
                    "\n--- CHANNEL TASTE MEMORY & EDITORIAL FEEDBACK ---\n"
                    "The channel owner has reviewed previous reel outputs. Strictly align your choices with this taste profile:\n"
                    + "\n".join(notes)
                    + "\n-------------------------------------------------\n"
                )

        prompt = f"""You are an Emmy-winning short-form video director and viral content strategist.
Your task is to analyze this timestamped video/podcast transcript and extract the top {clips_count} distinct 9:16 vertical clips (TikTok, YouTube Shorts, Instagram Reels).

Target Duration: {min_sec} to {max_sec} seconds per clip.
{feedback_prompt_section}
CINEMATIC 3-ACT NARRATIVE GRAMMAR:
Every selected clip MUST function as a self-contained micro-story adhering to this structure:
1. ACT I: THE HOOK (0–3 SECONDS):
   - Opens on an immediate high-stakes claim, contrarian belief, curiosity gap, intense conflict, or provocative question.
   - NEVER start on weak introductory filler or coordinating conjunctions ("And so", "Because", "Or like", "Well", "I mean"). Start cleanly on the punchy core thought!

2. ACT II: THE ESCALATION / CORE ARGUMENT:
   - Delivers the narrative context, proof, rising tension, or dynamic storytelling.
   - Segments marked with 🔥 [HIGH ENERGY] denote peaks in vocal volume, excitement, laughter, or dramatic emphasis. Strongly favor clips that contain or climax around these peaks.

3. ACT III: THE PAYOFF / PUNCHLINE / RESOLUTION:
   - Must definitively resolve the open loop raised in Act I.
   - NEVER cut off mid-thought or mid-sentence!
   - NEVER end on trailing conjunctions ("and then...", "so we decided to...", "which means that...").
   - End on a definitive terminal stop (punchline, conclusion, philosophical insight, or comedic reaction).

ADDITIONAL CONSTRAINTS:
- Distinct moments: Each clip must focus on a completely separate narrative moment or topic in the video.
- Exact timestamps: Provide start_seconds and end_seconds that exactly correspond to the natural start and natural concluding boundary in the transcript.

TRANSCRIPT:
{transcript_text}

Respond ONLY with valid JSON in this exact structure:
[
  {{
    "reel_index": 1,
    "hook_sentence": "Opening sentence that grips the audience in the first 2 seconds",
    "start_seconds": 45.2,
    "end_seconds": 78.5,
    "topic": "Short descriptive topic label",
    "narrative_arc": "Act 1: ...; Act 2: ...; Act 3: ..."
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

    return select_hooks_heuristic(segments, clips_count, target_duration, audio_peaks)

def select_hooks_heuristic(
    segments: List[Dict[str, Any]],
    clips_count: int = 3,
    target_duration: str = "30-60",
    audio_peaks: Optional[List[Dict[str, float]]] = None
) -> List[Dict[str, Any]]:
    """
    Rule-based fallback: extracts complete-sentence conversational blocks,
    prioritizing segments near audio peaks if available.
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
        
        # If we have audio peaks, find the nearest peak to target_center
        if audio_peaks:
            closest_peak = min(audio_peaks, key=lambda p: abs((p["start"] + p["end"]) / 2 - target_center))
            target_center = (closest_peak["start"] + closest_peak["end"]) / 2

        # Find start segment near target center
        start_seg = min(segments, key=lambda s: abs(s["start"] - (target_center - target_len / 2)))
        start_idx = segments.index(start_seg)

        # Ensure start_seg doesn't start with a weak coordinating conjunction
        for test_idx in range(start_idx, min(len(segments), start_idx + 3)):
            first_word = segments[test_idx]["text"].strip().split(" ")[0].lower()
            if first_word not in ["and", "so", "but", "because", "or", "well"]:
                start_idx = test_idx
                start_seg = segments[test_idx]
                break

        # Accumulate forward until reaching target duration
        cur_end = start_seg["end"]
        for j in range(start_idx, len(segments)):
            dur = segments[j]["end"] - start_seg["start"]
            if dur >= min_sec:
                cur_end = segments[j]["end"]
                # Stop cleanly if sentence ends with terminal punctuation (. ? !)
                txt = segments[j]["text"].strip()
                if txt.endswith((".", "!", "?")) or dur >= target_len:
                    break

        clips.append({
            "reel_index": i + 1,
            "hook_sentence": start_seg["text"].strip(),
            "start_seconds": start_seg["start"],
            "end_seconds": cur_end,
            "topic": f"Highlight #{i + 1}"
        })

    return clips
