# Phase 2: Declarative Registries & Matrix Validation

## Goal
Implement Zod schemas and definitions for input types (2), formats (4), platforms (5), and the matrix. Implement startup validation and the matrix resolver with zero engine hardcoding.

## Tasks
1. [x] Create base registry interfaces and Zod schemas in `src/registries/types.ts`.
2. [x] Implement input types: `src/registries/input-types/rss.ts`, `manual-url.ts`, and `all-inputs.ts`.
3. [x] Implement digest kinds: `src/registries/digest-kinds/` (7 kinds) and `all-digest-kinds.ts`.
4. [x] Implement format definitions with slot schemas:
   - [x] `text-post.ts`
   - [x] `thread.ts`
   - [x] `card.ts`
   - [x] `carousel.ts`
   - [x] `all-formats.ts`
5. [x] Implement platform constraint definitions:
   - [x] `linkedin.ts`
   - [x] `x.ts`
   - [x] `instagram.ts`
   - [x] `facebook.ts`
   - [x] `threads.ts`
   - [x] `all-platforms.ts`
6. [x] Implement `src/registries/matrix.ts` declaring permitted mappings and route resolution functions.
7. [x] Implement `src/registries/load-registries.ts` which validates all definitions on startup using Zod and verifies cross-reference integrity.
8. [x] Write automated test script (`src/registries/verify-registries.ts`) executable via `npm run registries:verify`.

## Done When
⛔
- [x] An invalid registry definition makes startup fail with a clear message (verified: schema violations, duplicate IDs, and broken matrix links all throw `RegistryValidationError`).
- [x] A test/script executes and prints all 28 valid `Input -> Format -> Platform` paths (`npm run registries:verify`).
- [ ] Stop and wait for user approval.
