# src/registries/ — Declarative Registries & Matrix

This directory defines all domain entities and permitted pairings without hardcoding any platform or format rules inside the processing engine.

## Subdirectories & Files
- `input-types/` — Declarative definitions for incoming content sources (`rss`, `manual-url`).
- `digest-kinds/` — Semantic categories for grounded fact extraction (`core_thesis`, `key_takeaway`, etc.).
- `formats/` — Platform-agnostic content shapes with slot Zod schemas (`text-post`, `thread`, `card`, `carousel`).
- `platforms/` — Target social platform constraints and packaging definitions (`linkedin`, `x`, `instagram`, `facebook`, `threads`).
- `matrix.ts` — Matrix mapping permitted `Input -> Format` and `Format -> Platform` routes.
- `load-registries.ts` — Startup validator executing Zod schemas against all registered entities.

