# Architecture Decision Records (ADRs)

This document tracks technical decisions, justifications, and package additions in reverse chronological order.

---

## 2026-10-31 — Project Architecture & Technology Foundation

### ADR 001: Next.js App Router with Thin Handlers
- **Context:** Need a modern TypeScript full-stack framework for server rendering, background worker coordination, and client UI.
- **Decision:** Use Next.js (App Router). Route handlers and React Server Components remain strictly thin presentation layers that invoke business logic functions inside `src/pipeline/`, `src/db/`, and `src/render/`.
- **Consequences:** Code remains testable and decoupled from Next.js server runtime quirks.

### ADR 002: Format-First, Platform-Last Declarative Registry
- **Context:** Multi-platform publishing engines frequently degenerate into massive conditional spaghetti (`if (platform === 'linkedin')`).
- **Decision:** Content flows through format shapes first (`text-post`, `thread`, `card`, `carousel`) and platform constraints last. All entities and permitted paths are declared in static registry files validated by Zod at startup.
- **Consequences:** Adding a new format or platform requires zero engine code modifications.

### ADR 003: Supabase Postgres with Plain SQL Migrations
- **Context:** Database storage needed for relational article, digest, format, and platform data.
- **Decision:** Use Supabase Postgres. Schema changes are strictly managed via timestamped `.sql` files in `supabase/migrations/`. Data access is performed through focused, single-table query functions in `src/db/`.
- **Consequences:** No heavy ORM overhead, zero schema drift, explicit migrations.

### ADR 004: Inngest for Background Job Orchestration
- **Context:** RSS polling, LLM calls, and server canvas rendering can be slow, fail transiently, or need retries.
- **Decision:** Use Inngest. Job files live in `src/jobs/` and only invoke standalone pipeline functions.
- **Consequences:** Step-level retries, local dev UI, reliable background execution.

### ADR 005: Konva for Both Browser Preview and Server Export
- **Context:** Template cards and multi-slide carousels must preview identically in the client editor and download as high-res PNGs or PDFs.
- **Decision:** Handcrafted JSON template schema rendered with `konva` in the browser and `konva` + native `canvas` on the Node.js server.
- **Consequences:** Shared layout logic between browser and server eliminates preview-export discrepancy. Server rendering is constrained to the Node runtime.

### ADR 006: Explicit Single-User / Multi-Tenancy Seam
- **Context:** MVP does not include user accounts, logins, or brand switching, but future multi-tenancy must not require rewriting the data model.
- **Decision:** Every table retains `account_id` and `brand_id`. A single helper, `src/lib/current-context.ts`, returns the seeded default account and brand.
- **Consequences:** Clean migration path to full authentication later with zero schema alterations.

### ADR 007: Strict Anti-Hallucination & Provenance Tracking
- **Context:** Editorial publishers will not tolerate AI-invented facts or quotes.
- **Decision:** Every digest item must contain verbatim source sentence(s) from the article text. Formats may only draw from digest items. Formats output `source_item_ids` linking back to source sentences, which are displayed directly in the review UI.
- **Consequences:** Guarantees 100% verifiable grounding for every exported piece of content.

### ADR 008: Cloud-First Supabase Architecture (No Local Docker)
- **Context:** User requested no local Docker environment; cloud database infrastructure chosen for scale and ease of migration.
- **Decision:** Target Supabase cloud project directly via `.env.local` credentials (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Plain SQL migrations remain tracked in `supabase/migrations/`.
- **Consequences:** No local Docker daemon required. Migrations can be applied via Supabase CLI (`supabase db push`) or direct SQL runner in the Supabase dashboard.

### ADR 009: In-Article Image Caching in Supabase Storage
- **Context:** Articles contain external images that may fail due to hotlinking restrictions or cause CORS errors when rendering on HTML5 canvas.
- **Decision:** Extracted in-article images are downloaded and stored in Supabase Storage bucket (`article-images`). Future migration to Cloudinary noted for high scale.
- **Consequences:** Safe cross-origin rendering on canvas without tainting; reliable asset persistence.

### ADR 010: Bundled Open-Source Typography & Zero Custom Font Uploads
- **Context:** Server-side canvas rendering requires exact font metrics matching browser canvas. User uploads of arbitrary fonts carry copyright/licensing infringement risks.
- **Decision:** Ship standard SIL Open Font License fonts (`Inter` and `Playfair Display`) as `.ttf` files directly in `public/fonts/`. Server Konva registers them via `registerFont()`; browser loads via `@font-face`. Disallow custom `.ttf` uploads during MVP.
- **Consequences:** 1:1 render parity between browser preview and server export, with zero copyright/licensing ambiguity.

### ADR 011: Free-Tier LLM Architecture
- **Context:** Need zero/low-cost experimentation during early development with seamless future model swapping.
- **Decision:** Use Google Gemini 2.0 Flash / 1.5 Flash via `@google/genai` (generous free tier) behind a clean, provider-agnostic interface in `src/llm/`.
- **Consequences:** Low friction during development; swappable to Claude or OpenAI via configuration without touching pipeline stages.

### ADR 012: Minimal Phase 1 Dependency Justification
- **Context:** Rule 4.1.8 requires justifying all dependencies before adding them.
- **Decision:** Install only the minimum packages required for Phase 1:
  - `next`, `react`, `react-dom`: Standard App Router application runtime.
  - `typescript`, `@types/node`, `@types/react`, `@types/react-dom`: Strict type safety across pipeline interfaces.
  - `tailwindcss`, `postcss`, `autoprefixer`: Token-based utility styling matching `docs/design-system.md`.
  - `zod`: Declarative registry validation and JSON schema enforcement.
  - `@supabase/supabase-js`: Official Postgres and Storage client for Cloud Supabase.
  - `inngest`: Official client for orchestrating multi-step background pipeline jobs with built-in retries.
  - `tsx` (dev): Lightweight TypeScript script runner for schema verification and migration sanity checks without full compilation.
- **Consequences:** Zero unneeded dependencies or heavy UI libraries. All business logic remains plain TypeScript functions.

### ADR 013: Article Ingest Dependencies (Cheerio & fast-xml-parser)
- **Context:** Phase 3 requires fetching and parsing RSS/Atom feeds and extracting article text, metadata, and in-article images from arbitrary publisher web pages.
- **Decision:** Install:
  - `fast-xml-parser`: Pure JS, high-performance XML/Atom/RSS parser with zero dependencies.
  - `cheerio`: Lightweight, robust server-side DOM parser for extracting article body text, stripping boilerplate/scripts, and collecting in-article `<img>` URLs.
  - Native `node:crypto`: Built-in Node module used for SHA-256 content deduplication (zero external dependency).
- **Consequences:** Avoids heavy headless browser runtimes (Puppeteer/Playwright) and avoids bloated RSS libraries. Keeps ingest fast, lightweight, and deterministic.

### ADR 014: Official Google GenAI SDK (@google/genai)
- **Context:** Phase 4 requires connecting to the Google Gemini Flash API for grounded digest extraction with structured JSON schemas.
- **Decision:** Install `@google/genai`, the current official Google Gemini SDK. Wrap calls behind a clean provider interface in `src/llm/llm-provider.ts` so the engine never couples directly to Gemini.
- **Consequences:** Type-safe structured outputs using Gemini's native JSON mode and strict schema validation. Single point of configuration in `src/llm/`.

### ADR 015: Rendering Engine Dependencies (Konva, Canvas, pdf-lib)
- **Context:** Phase 7 requires rendering card graphics and multi-page carousels in both browser canvas (interactive preview) and server-side Node runtime (export PNG/PDF).
- **Decision:** Install:
  - `konva`: 2D canvas scene-graph framework.
  - `react-konva`: React declarative wrapper for client-side preview in the review workbench.
  - `canvas`: Native Cairo-backed canvas for Node.js server export and font metric layout.
  - `pdf-lib`: Pure JavaScript PDF assembler for multi-slide LinkedIn document carousels.
- **Consequences:** Layout logic and text metrics are shared 100% between client and server, guaranteeing pixel-perfect parity between preview and final export.

### ADR 016: Storing Custom User Templates in `brand_kits.custom_templates`
- **Context:** Editorial users need to create and persist custom visual templates for cards and carousels without introducing heavy schema migrations during the MVP.
- **Decision:** Store user templates and workflow mappings inside the `custom_templates` JSON column on the `brand_kits` table.
- **Consequences:** Zero database schema drift or migration overhead for the MVP. Respects the `brand_id` multi-tenant seam while preparing for a future standalone `templates` table when multi-brand workspaces launch.

### ADR 017: Carousel Archetype Prototype Architecture
- **Context:** Carousels vary in length (3 to 8 slides) based on extracted article claims, but requiring users to visually design each slide manually would be tedious and brittle.
- **Decision:** Designers customize 3 archetype prototype pages: Cover (Page 0), Body Takeaway Prototype (Page 1), and Closing CTA (Page 2). During generation and export, `expandCarouselTemplate` dynamically clones the Body prototype for each extracted body slide, binding slots like `body_slides.${i}.title` and `body_slides.${i}.body`.
- **Consequences:** Single-pass styling for multi-slide presentations. Guarantees uniform typography, coordinates, and brand colors across all slides regardless of deck length.

### ADR 018: Review-Gated Scheduling with Zero-Friction Manual Dispatch
- **Context:** Automatic API posting carries high trust anxiety for small creators and editorial teams (fear of rogue AI updates). However, simple generative workflows without scheduling create low retention.
- **Decision:** Implement manual review-gated scheduling (Option 2) rather than blind pipeline auto-scheduling. Users approve grounded content in the review workbench and click `[ Schedule ]`. To counter manual posting friction, provide a streamlined "Ready to Publish" cockpit (1-click clipboard copy, 1-click asset bundle downloads, direct platform deep-links, and `Mark as Published`).
- **Consequences:** Builds psychological ownership (IKEA effect), enforces 100% human-verified quality on the calendar, and collects in-app user trust votes before investing in complex third-party social publishing APIs.

### ADR 019: Calendar State & Trust Polling Persistence in JSONB/Status Columns
- **Context:** Adding calendar scheduling and trust poll metrics needed to work instantly against the live Cloud Supabase database without requiring immediate schema alterations or external tables.
- **Decision:** Extend `format_outputs.status` (`scheduled`, `published`) and store scheduling timestamps (`scheduled_at`, `scheduled_has_time`, `published_at`) inside `format_outputs.slots_data`. Store the 1-time auto-posting trust poll vote inside `brand_kits.custom_templates.autoPostTrustVote`.
- **Consequences:** Zero database downtime or manual SQL push needed for the MVP while keeping schema documentation fully recorded in `supabase/migrations/00004_add_calendar_scheduling.sql`.

### ADR 020: Cloudflare R2 S3-Compatible Client for Ephemeral Media Storage
- **Context:** Long-form video repurposing (YouTube audio/video and user video uploads up to 2.5GB) requires high-capacity object storage with presigned upload URLs and zero egress bandwidth fees.
- **Decision:** Use Cloudflare R2 via `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`. Wrap all operations behind a pluggable interface in `src/storage/video-storage.ts` with local filesystem fallback for offline development.
- **Consequences:** Client browsers upload directly to R2 via presigned URLs, bypassing Vercel/Next.js payload limits completely. Raw video files are deleted immediately after rendering the 3 short 9:16 reels, minimizing storage costs.

### ADR 021: Decoupled Asynchronous Python Worker Architecture for Video Rendering
- **Context:** Heavy media processing (Whisper speech recognition, FFmpeg filter graphs, 2GB+ video downloads) cannot run inside Next.js/Vercel serverless functions due to 60s execution timeouts and lack of GPU acceleration.
- **Decision:** Isolate all video processing into a standalone asynchronous Python worker in `worker/`. The web app and worker communicate exclusively through Supabase (`video_render_jobs` table) and Cloudflare R2.
- **Consequences:** Next.js UI remains ultra-fast and lightweight. The worker can be run on a local machine, a free Google Colab T4 GPU, or scalable GPU clouds (Modal/RunPod) with zero code changes in the Next.js application.

### ADR 022: Active-Word Karaoke Subtitles with Dynamic ASS Overlays and Word Timestamps
- **Context:** Modern vertical social media reels require dynamic, word-by-word karaoke subtitles with custom brand typography and outline strokes. Standard SRT/VTT formats only support static block cues.
- **Decision:** Use `faster-whisper` with `word_timestamps=True` to extract exact word millisecond start/end boundaries. Generate Advanced SubStation Alpha (`.ass`) subtitles with `{\c&H00FFFFFF&}` active highlighting tags and burn them directly via FFmpeg's `subtitles` filter graph.
- **Consequences:** Produces high-retention social reels without requiring external video editing software (Premiere/CapCut). Clean `.srt` files are also generated and offered as optional exports.

### ADR 023: Zero-Secret Google Colab Runner via Encrypted Userdata Secrets
- **Context:** Running the worker on Google Colab requires cloud credentials (Supabase, Cloudflare R2, Gemini API). Hardcoding or pasting credentials into notebook cells creates dangerous secret exposure risks if notebooks are shared or committed.
- **Decision:** Configure `worker/config.py` and `worker/colab_runner.ipynb` to read credentials directly from Google Colab's native encrypted Secrets vault (`google.colab.userdata`).
- **Consequences:** Zero API keys or tokens are stored or displayed in the notebook code or Git history. Secrets remain encrypted and private to the user's Google account.





