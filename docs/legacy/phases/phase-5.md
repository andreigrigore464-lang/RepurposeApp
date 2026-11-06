# Phase 5: Format Generation

## Goal
Implement slot synthesis for the 4 core formats (`text-post`, `thread`, `card`, `carousel`) exclusively using items from the grounded digest.

## Tasks
1. [x] Implement format generation base helper (`src/pipeline/3-format/format-generator-base.ts`) with schema validation, provenance checking, and bounded retries.
2. [x] Implement individual format generators in `src/pipeline/3-format/`:
   - [x] `generate-text-post.ts`
   - [x] `generate-thread.ts`
   - [x] `generate-card.ts`
   - [x] `generate-carousel.ts`
3. [x] Implement multi-format orchestrator (`src/pipeline/3-format/generate-all-formats.ts`).
4. [x] Enforce slot schema validation via the respective Zod schema in `src/registries/formats/`.
5. [x] Require each format output to reference specific digest item IDs in `referenced_item_ids`.
6. [x] Implement bounded retry loop for slot constraints (verified: carousel schema issue automatically corrected on attempt 1).
7. [x] Persist generated formats in `format_outputs` table with `status: 'draft'`.
8. [x] Implement Inngest generation job (`src/jobs/generate-formats-job.ts`) with stage logging:
   `[format] article=123 format=carousel status=success`.
9. [x] Author end-to-end verification script (`src/pipeline/3-format/verify-formats.ts`).

## Done When
- [x] Format generation creates valid slot outputs for all 4 formats (verified: text-post, thread, card, carousel all created).
- [x] All format outputs validate against their Zod slot schemas.
- [x] Every slot links to underlying digest item IDs, preserving full provenance.
