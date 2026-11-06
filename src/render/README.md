# src/render/ — Visual Template Rendering Engine

This directory implements the custom JSON template rendering engine for cards and carousels using Konva.

## Subdirectories & Files
- `template-schema.ts` — Zod schema defining the structure of template JSON documents.
- `templates/` — Handwritten JSON templates (`card-default.json`, `carousel-default.json`).
- `layout/` — Shared text measurement, line wrapping, and font auto-shrink calculations.
- `render-in-browser.tsx` — Interactive React-Konva canvas component for client-side editing and preview.
- `render-on-server.ts` — Headless Node canvas Konva renderer for generating export PNG buffers and PDFs.

