# Phase 0: Specifications & Foundations

## Goal
Write `AGENTS.md` and the complete specification document set in `docs/` (including all phase files). Propose the initial digest item kinds and each format's slot schema for user review.

## Tasks
1. [x] Create `AGENTS.md` codifying all 10 non-negotiable intelligibility rules, anti-hallucination rules, registry engine rules, content right rules, and multi-tenancy seam rules.
2. [x] Write `docs/00-product.md` specifying problem, audience, in-scope features, and out-of-scope boundaries.
3. [x] Write `docs/01-architecture.md` outlining the pipeline diagram, format-first/platform-last concept, data flow, and directory map.
4. [x] Write `docs/02-registries.md` detailing the registry concept, proposed initial digest item kinds, proposed format slot schemas, platform definitions, and the matrix resolver.
5. [x] Write `docs/03-pipeline.md` detailing all 5 processing stages, typed inputs/outputs, failure handling, retry loops, and stage logging format.
6. [x] Write `docs/04-rendering.md` defining the JSON template schema, slot binding, font handling, browser Konva preview, and server Konva rendering.
7. [x] Write `docs/05-data-model.md` defining SQL table definitions, relations, foreign keys, and the `current-context.ts` single seam.
8. [x] Write platform constraints for all 5 platforms in `docs/platforms/` (`linkedin.md`, `x.md`, `instagram.md`, `facebook.md`, `threads.md`).
9. [x] Write `docs/design-system.md` establishing the calm editorial workbench visual aesthetic, typography, color tokens, and layout guidelines.
10. [x] Write `docs/decisions.md` logging foundational architecture decisions.
11. [x] Write `docs/open-questions.md` listing ambiguities, choices, and recommendations for user review.
12. [x] Write phase roadmaps in `docs/phases/` (`phase-0.md` through `phase-9.md`).

## Done When
- [x] ⛔ The user reviewed and explicitly approved the documentation and proposed schemas (Approved: 2026-10-31).
- [x] All 5 foundational open questions resolved and recorded in `docs/decisions.md` (ADRs 008–011).

