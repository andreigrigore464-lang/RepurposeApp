# Video Reels Repurposing Pipeline & Vertical Studio Specification

> **Domain:** Video Ingest, AI Hook Selection, 9:16 Vertical Video Rendering, and Active-Word Karaoke Subtitles  
> **Status:** Live & Implemented on `feature/video-reels`  
> **Last Updated:** 2026-11-07  

---

## 1. Feature Overview

The Video Reels Repurposing Pipeline enables editorial teams and creators to transform long-form video content (YouTube channel feeds, direct YouTube links, and multi-GB `.mp4`/`.mov` uploads) into 3 high-impact, 9:16 vertical short-form promo reels (TikTok, YouTube Shorts, Instagram Reels).

### Core Pillars
1. **Semantic Hook Selection:** AI auto-hook discovery identifies self-contained narrative climaxes (30–60s) with complete-thought resolution (never cutting speech mid-sentence).
2. **Active-Word Karaoke Subtitles:** Synchronized word-by-word active highlighting with customizable typography (Anton, Komika Axis, Montserrat, Bebas Neue), stroke outlines, and brand highlight colors.
3. **Decoupled Asynchronous Worker:** Heavy speech transcription (`faster-whisper`), video download (`yt-dlp`), and video cutting (`ffmpeg`) are completely decoupled into an asynchronous Python worker pulling jobs from Supabase.
4. **Direct Cloudflare R2 Uploads:** Multi-GB video files bypass serverless timeouts via presigned S3-compatible PUT URLs directly from the browser to Cloudflare R2, with automatic ephemeral deletion of the raw source file after reels are rendered.

---

## 2. Architecture & Data Flow

```
[ User Browser / Feed Poller ]
       │
       ▼ (1. Direct Upload or Atom RSS Ingest)
[ Cloudflare R2 Storage ] ◄───────────────► [ Supabase Cloud Database ]
  • Presigned PUT (2.5GB)                    • articles (source_type, media_metadata)
  • Cut 9:16 MP4s                            • video_render_jobs (queue & progress)
  • Ephemeral source cleanup                 • format_outputs (format_kind: "video-reel")
                                                         ▲
                                                         │ (2. Polling loop)
                                              [ Decoupled Python Worker ]
                                                • faster-whisper (word timestamps)
                                                • Gemini AI Hook Selection
                                                • FFmpeg 9:16 framing + ASS karaoke burn
```

---

## 3. Database Schema & State Models

### Migration: `supabase/migrations/00005_add_video_reels_pipeline.sql`

#### A. Articles Table Extensions
```sql
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS media_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
```
- `source_type`: `"article" | "youtube" | "video_upload"`
- `media_metadata`: `{ videoId?: string, thumbnailUrl?: string, duration_seconds?: number, storage_key?: string }`

#### B. Asynchronous Job Queue: `video_render_jobs`
```sql
CREATE TABLE IF NOT EXISTS video_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  progress_pct INT NOT NULL DEFAULT 0,
  stage_message TEXT DEFAULT 'Waiting in queue...',
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Job Status Lifecycle:**
`"queued"` → `"transcribing"` → `"selecting_hooks"` → `"rendering"` → `"completed"` | `"failed"`

#### C. Format Outputs: `format_outputs`
When `format_kind === "video-reel"`, `slots_data` stores:
```json
{
  "reel_index": 1,
  "video_url": "https://...r2.cloudflarestorage.com/reels/.../reel_1.mp4?...",
  "storage_key": "reels/<job_id>/reel_1.mp4",
  "duration_seconds": 42.5,
  "aspect_ratio": "9:16",
  "start_timestamp": "01:14",
  "end_timestamp": "01:56",
  "hook_text": "Most people think waking up before alarms was impossible...",
  "srt_content": "1\n00:01:14,200 --> 00:01:16,500\nMOST PEOPLE THINK..."
}
```

---

## 4. UI Components & System Layers

### A. Repurpose Studio (`/repurpose`)
A full-page dedicated workspace replacing ad-hoc inline bars, decomposed into single-responsibility modules:
- [`repurpose-studio.tsx`](file:///d:/Work/RepurposeApp/src/components/repurpose/repurpose-studio.tsx) (75 lines): Top-level coordinator switching between Written Article mode and Video Reels mode.
- [`article-repurpose-panel.tsx`](file:///d:/Work/RepurposeApp/src/components/repurpose/article-repurpose-panel.tsx) (290 lines): Single article URL inspection and raw text draft repurposing with workflow routing.
- [`video-repurpose-panel.tsx`](file:///d:/Work/RepurposeApp/src/components/repurpose/video-repurpose-panel.tsx) (365 lines): YouTube link inspector with instant thumbnail preview and drag-and-drop R2 direct uploader with XHR progress calculation.
- [`video-reel-settings.tsx`](file:///d:/Work/RepurposeApp/src/components/repurpose/video-reel-settings.tsx) (273 lines): Form controls for visual reel templates, hook mode (AI auto-hooks vs manual timestamps), clip duration (15–30s, 30–60s, 60–90s), spoken language, and studio vocabulary hints.
- [`video-progress-card.tsx`](file:///d:/Work/RepurposeApp/src/components/repurpose/video-progress-card.tsx) (105 lines): Live polling ticker reflecting worker progress percentages and output reel cards.

### B. YouTube Channel Workflows (`/feeds`)
Automates recurring syndication from YouTube channels:
- [`discover-youtube-feed.ts`](file:///d:/Work/RepurposeApp/src/pipeline/1-ingest/discover-youtube-feed.ts) (142 lines): Resolves channel handles (`@channel`), channel URLs, raw channel IDs (`UC...`), and individual video links into official Atom RSS XML feeds (`https://www.youtube.com/feeds/videos.xml?channel_id=UC...`).
- [`workflow-builder-modal.tsx`](file:///d:/Work/RepurposeApp/src/components/feeds/workflow-builder-modal.tsx) (388 lines): Modal with Source Type toggle: `[ Article / RSS ]` vs `[ YouTube Channel ]`.
- [`workflow-youtube-fields.tsx`](file:///d:/Work/RepurposeApp/src/components/feeds/workflow-youtube-fields.tsx) (162 lines): Specialized settings for YouTube workflows (reel templates, clips count, duration, vocab).
- [`workflow-card.tsx`](file:///d:/Work/RepurposeApp/src/components/feeds/workflow-card.tsx) (279 lines): Renders 9:16 vertical swatch preview, clips count, and soft target duration.
- [`poll-feed.ts`](file:///d:/Work/RepurposeApp/src/pipeline/1-ingest/poll-feed.ts) (201 lines): Safe polling ingest. On initial poll, only ingests videos published *after* workflow creation (or at most the single latest video), preventing back-catalog flood, and automatically enqueues `video_render_jobs`.

### C. Visual Template Designer (`/templates`)
- [`template-schema.ts`](file:///d:/Work/RepurposeApp/src/render/template-schema.ts): Extended with `VideoElementSchema` (`aspectRatio: "vertical"`, `framingMode: "crop" | "blurred_background"`) and `CaptionsElementSchema` (`fontName`, `fontSize`, `activeWordColor`, `wordsPerPhrase`).
- [`video-reel-default.json`](file:///d:/Work/RepurposeApp/src/render/templates/video-reel-default.json): Bundled 1080×1920 vertical default template with sharp foreground feed, blurred background expansion, and active-word karaoke styling.
- [`templates-manager.tsx`](file:///d:/Work/RepurposeApp/src/components/templates/templates-manager.tsx): Visually partitions templates into **Static Post Templates** and **Short Video Reel Templates** with a `+ New Video Reel` creator.

### D. Drafts Inbox & Review Workbench (`/inbox` & `/review/[id]`)
- [`inbox-format-badges.tsx`](file:///d:/Work/RepurposeApp/src/components/inbox/inbox-format-badges.tsx) (172 lines): Displays individual format pills (`Reel #1 (0:42)`, `Reel #2 (0:38)`) and live animated worker progress spinners (`⚙️ transcribing: 35%`).
- [`inbox-table-row.tsx`](file:///d:/Work/RepurposeApp/src/components/inbox/inbox-table-row.tsx) (160 lines): Shows YouTube/video thumbnail, source type badges (`🔴 YouTube`, `📹 Video`), and transcript status.
- [`video-reel-player.tsx`](file:///d:/Work/RepurposeApp/src/components/review/video-reel-player.tsx) (157 lines): 9:16 vertical HTML5 video player inside `/review/[id]`, displaying hook climax sentence, duration, timestamps, and action buttons (`Download MP4`, `Download .SRT`, `Schedule`).

---

## 5. Asynchronous Python Worker (`worker/`)

The worker runs independently on local machines or Google Colab (with free NVIDIA T4 GPU acceleration):

- [`config.py`](file:///d:/Work/RepurposeApp/worker/config.py): Environment credential loader supporting `.env.local` files and Google Colab native Secrets (`google.colab.userdata`). Auto-detects compute device (`cuda` with `float16` when GPU available, else `cpu` with `int8`).
- [`subtitles.py`](file:///d:/Work/RepurposeApp/worker/subtitles.py): Formats Advanced SubStation Alpha (`.ass`) karaoke subtitles with active-word highlight coloring (`{\c&H00FFFFFF&}`), line breaks, font families, and clean `.srt` export.
- [`hook_selector.py`](file:///d:/Work/RepurposeApp/worker/hook_selector.py): Prompts Gemini (or falls back to heuristics) to detect self-contained narrative climaxes (30–60s) with complete-thought resolution.
- [`cutter.py`](file:///d:/Work/RepurposeApp/worker/cutter.py): Cuts video snippets and applies FFmpeg filter graph for 9:16 vertical layout (crop or blurred pad) and burns `.ass` subtitles.
- [`pipeline.py`](file:///d:/Work/RepurposeApp/worker/pipeline.py): Downloads media, transcribes with `faster-whisper`, cuts reels, uploads finished MP4s to Cloudflare R2, inserts rows into `format_outputs`, and **deletes the raw source video from R2** (ephemeral media cost-saving rule).
- [`main.py`](file:///d:/Work/RepurposeApp/worker/main.py): Polling daemon loop polling `video_render_jobs` where `status = 'queued'`.
- [`colab_runner.ipynb`](file:///d:/Work/RepurposeApp/worker/colab_runner.ipynb): 1-click Google Colab notebook for free T4 GPU execution using encrypted Colab Secrets (🔑 tab).

