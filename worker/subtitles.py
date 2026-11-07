"""
Subtitle Generator (ASS & SRT)
Generates active-word karaoke ASS subtitles and clean SRT tracks for 9:16 vertical video reels.
System Layer: worker / subtitles
"""

import re
from typing import List, Dict, Any

def hex_to_ass_color(hex_str: str) -> str:
    """
    Converts CSS hex color (#RRGGBB) to ASS BGR format (&H00BBGGRR&).
    """
    cleaned = hex_str.strip().lstrip("#")
    if len(cleaned) == 6:
        r, g, b = cleaned[0:2], cleaned[2:4], cleaned[4:6]
        return f"&H00{b}{g}{r}&"
    return "&H00FFFFFF&"

def format_ass_time(seconds: float) -> str:
    """Formats seconds into ASS timestamp H:MM:SS.cc"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    cs = int(round((seconds - int(seconds)) * 100))
    if cs >= 100:
        cs = 99
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def format_srt_time(seconds: float) -> str:
    """Formats seconds into SRT timestamp HH:MM:SS,mmm"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    if ms >= 1000:
        ms = 999
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def parse_time_to_seconds(t_str: str) -> float:
    """Parses timestamp string ('1:04', '01:04', '00:01:04', or '64') into float seconds."""
    parts = str(t_str).strip().split(":")
    if len(parts) == 1:
        return float(parts[0])
    elif len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    elif len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    raise ValueError(f"Invalid timestamp format: {t_str}")

def group_words_into_phrases(
    words: List[Dict[str, Any]],
    max_words: int = 4,
    max_gap: float = 0.5
) -> List[List[Dict[str, Any]]]:
    """
    Groups words into short phrases (2-4 words) suitable for mobile vertical reels.
    Splits when speech pause > max_gap, phrase reaches max_words, or on strong punctuation.
    """
    phrases = []
    current_phrase = []

    for w in words:
        if not current_phrase:
            current_phrase.append(w)
            continue

        prev_w = current_phrase[-1]
        gap = w["start"] - prev_w["end"]
        has_break_punct = bool(re.search(r"[.!?,\n]", prev_w["word"]))

        if gap > max_gap or len(current_phrase) >= max_words or (has_break_punct and len(current_phrase) >= 2):
            phrases.append(current_phrase)
            current_phrase = [w]
        else:
            current_phrase.append(w)

    if current_phrase:
        phrases.append(current_phrase)

    return phrases

def generate_ass(
    phrases: List[List[Dict[str, Any]]],
    font_name: str = "Anton",
    font_size: int = 92,
    color_primary: str = "&H00BDDF3C&",
    color_highlight: str = "&H00FFFFFF&",
    outline_color: str = "&H00000000&",
    outline_width: int = 8,
    shadow: int = 4,
    margin_v: int = 550,
) -> str:
    """
    Generates ASS subtitle content with word-by-word active karaoke highlighting.
    """
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{color_primary},&H000000FF,{outline_color},&H80000000,-1,0,0,0,100,100,1,0,1,{outline_width},{shadow},2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    dialogues = []

    for phrase in phrases:
        for idx, active_word in enumerate(phrase):
            w_start = active_word["start"]
            # End at next word's start to eliminate visual subtitle flicker
            if idx < len(phrase) - 1:
                w_end = phrase[idx + 1]["start"]
            else:
                w_end = active_word["end"]

            start_str = format_ass_time(w_start)
            end_str = format_ass_time(w_end)

            parts = []
            for j, w in enumerate(phrase):
                raw_word = w["word"].strip().upper()
                # Sanitize word: keep alphanumeric, standard punctuation, whitespace, and accents
                txt = re.sub(r'[^\w\s.,!?:;\'"–—\-$%@#&()/*]', '', raw_word).strip()
                if not txt:
                    continue
                if j == idx:
                    parts.append(f"{{\\c{color_highlight}}}{txt}{{\\c{color_primary}}}")
                else:
                    parts.append(txt)

            # Split into 2 balanced lines if 4 or more words
            if len(parts) >= 4:
                half = (len(parts) + 1) // 2
                line = " ".join(parts[:half]) + "\\N" + " ".join(parts[half:])
            else:
                line = " ".join(parts)

            dialogues.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{line}")

    return header + "\n".join(dialogues) + "\n"

def generate_srt(phrases: List[List[Dict[str, Any]]]) -> str:
    """Generates standard SRT subtitles for external editors (Premiere, CapCut, etc.)."""
    lines = []
    idx = 1
    for phrase in phrases:
        start_str = format_srt_time(phrase[0]["start"])
        end_str = format_srt_time(phrase[-1]["end"])
        text = " ".join(w["word"].strip().upper() for w in phrase)
        lines.append(f"{idx}\n{start_str} --> {end_str}\n{text}\n")
        idx += 1
    return "\n".join(lines)

