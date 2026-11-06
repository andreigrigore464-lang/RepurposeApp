# RepurposeApp Video Worker Engine

This directory contains the asynchronous background video worker that cuts long-form podcasts, video files, and YouTube videos into 9:16 vertical promo reels with active-word karaoke subtitles.

## Architecture

The worker is completely decoupled from the Next.js web application. It communicates via Supabase and Cloudflare R2:

1. **Job Queue:** Polls the `video_render_jobs` table in Supabase where `status = 'queued'`.
2. **Media Download:** Pulls the raw video from YouTube (`yt-dlp`) or Cloudflare R2 (`boto3`).
3. **Word-by-Word Transcription:** Uses `faster-whisper` with word timestamps and phonetic vocabulary hints.
4. **AI Auto-Hook Detection:** Prompts Gemini to identify complete-thought 30–60s conversational climaxes (or uses manual timestamps).
5. **Framing & Subtitle Burning:** Uses FFmpeg to cut the 9:16 vertical video and burn dynamic ASS karaoke subtitles.
6. **Upload & Ephemeral Cleanup:** Uploads the cut ~15MB reels to Cloudflare R2, inserts rows into `format_outputs`, and automatically deletes the 2GB+ raw input video from R2 to minimize storage costs.

## Files

- `requirements.txt`: Python package dependencies.
- `config.py`: Environment credential loader (Supabase, Cloudflare R2, Gemini API) and device detection (`cuda` vs `cpu`).
- `subtitles.py`: ASS and SRT generator with active-word karaoke syntax (`{\\c&H00FFFFFF&}`).
- `hook_selector.py`: AI auto-hook detection analyzing transcripts for complete-thought narrative climaxes.
- `cutter.py`: FFmpeg filter graph compiler and subtitle burner.
- `pipeline.py`: End-to-end execution pipeline for a single queued job.
- `main.py`: Polling daemon loop.
- `colab_runner.ipynb`: 1-click Google Colab notebook for free T4 GPU execution.

## Running Locally

```bash
cd worker
pip install -r requirements.txt
python main.py
```

