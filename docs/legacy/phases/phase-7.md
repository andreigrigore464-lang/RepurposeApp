# Phase 7: Rendering Engine (Template JSON & Konva)

## Goal
Implement the JSON template renderer using Konva, supporting browser preview and server-side PNG/PDF rendering, shipping 1 card template and 1 carousel template with brand kit styling applied.

## Tasks
1. [x] Define template JSON schema with Zod in `src/render/template-schema.ts`.
2. [x] Author handwritten template JSON definitions:
   - `src/render/templates/card-default.json` (1080x1080 square).
   - `src/render/templates/carousel-default.json` (1080x1350 4:5 portrait).
3. [x] Implement shared layout calculations (`src/render/layout/calculate-text-layout.ts`):
   - Uniform text wrapping and bounds calculation.
   - Auto-shrink font sizing for slot text fitting.
4. [x] Implement slot and brand theme resolver (`src/render/layout/resolve-slots.ts`).
5. [x] Implement client-side preview component (`src/render/render-in-browser.tsx`) using React-Konva.
6. [x] Implement server-side renderer (`src/render/render-on-server.ts`) using Node `canvas`.
7. [x] Register local open-source SIL font files (`Inter`, `Playfair Display`) for the server environment.
8. [x] Implement multi-page PDF compilation for carousels using `pdf-lib` (`src/render/compile-carousel-pdf.ts`).
9. [x] Author verification script (`src/render/verify-rendering.ts`) saving outputs to `public/exports-test/`.

## Done When
- [x] A test renders the declarative template JSON to server Node canvas and produces PNG buffers with verified dimensions (`1080x1080` for card, `1080x1350` for carousel).
- [x] Multi-page carousel PDF compiles successfully with correct page count (3 pages) and valid PDF headers.
- [x] Verified via `npm run render:verify`.
- [x] Full application build verified via `npm run build` (0 TypeScript / compilation errors).
