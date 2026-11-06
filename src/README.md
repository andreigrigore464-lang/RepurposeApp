# src/ — Core Application Source

This directory contains the entire application codebase for the article repurposing SaaS MVP.

## Subdirectories
- `registries/` — Declarative Zod schemas and definitions for input types, digest kinds, formats, platforms, and the matrix resolver.
- `pipeline/` — Sequential pipeline stages: 1-ingest, 2-digest, 3-format, 4-adapt.
- `render/` — Konva-based visual layout engine and JSON template definitions (browser and server).
- `export/` — Export formatters (clipboard text, PNGs, carousel PDFs/ZIPs).
- `llm/` — Minimal provider-agnostic interface wrapping LLM calls with bounded retries.
- `db/` — Supabase database client and focused table query modules.
- `jobs/` — Inngest background event bus client and background job definitions.
- `lib/` — Core environment utilities and the single-user auth seam (`current-context.ts`).
- `app/` — Thin Next.js App Router UI pages, layouts, and API route handlers.

