# Phase 6: Platform Adapters

## Goal
Implement deterministic platform packaging adapters for LinkedIn, X, Instagram, Facebook, and Threads, ensuring platform constraints are applied strictly via registry rules with zero platform names hardcoded into the core engine.

## Tasks
1. [x] Implement generic hashtag formatter (`src/pipeline/4-adapt/format-hashtags.ts`) reading declarative platform policies.
2. [x] Implement platform adapter (`src/pipeline/4-adapt/adapt-format-to-platform.ts`):
   - [x] Text length enforcement and intelligent condensation against platform character ceilings.
   - [x] Hashtag formatting and positioning.
   - [x] Media packaging specifications (PDF documents for document platforms, image sequences for multi-image platforms, single image for card platforms).
   - [x] Visible fold warnings.
3. [x] Implement adaptation orchestrator (`src/pipeline/4-adapt/adapt-all-formats.ts`).
4. [x] Implement database persistence in `src/db/queries-platform-variants.ts` (`insertPlatformVariant`, `listVariantsForFormat`).
5. [x] Ensure engine contains ZERO `if (platform === '...')` checks; all logic reads strictly from platform registry definitions (verified by automated static inspection).
6. [x] Implement Inngest adaptation job (`src/jobs/adapt-platforms-job.ts`) registered on `app/formats.generated`.
7. [x] Author end-to-end verification script (`src/pipeline/4-adapt/verify-adapters.ts`).

## Done When
⛔
- [x] Platform variants respect character counts, hashtag limits, and media packaging for each platform (verified: all 14 matrix paths produce valid variants).
- [x] Zero platform names appear inside core pipeline/engine code (verified: static codebase assertion passes).
- [ ] Stop and wait for user approval.
