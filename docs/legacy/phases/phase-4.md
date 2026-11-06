# Phase 4: Grounded Digest via LLM

## Goal
Implement the Grounded Digest stage using the chosen LLM provider, extracting atomic factual items with verbatim source sentences, strict Zod validation, bounded retry, and visible failed state handling.

## Tasks
1. [x] Set up LLM provider client wrapper in `src/llm/llm-provider.ts` behind an explicit interface (`LlmProvider`, `GeminiLlmProvider`).
2. [x] Build digest schema and types (`src/pipeline/2-digest/digest-schema.ts`):
   - [x] Extraction of atomic items matching registered digest kinds.
   - [x] Requirement of exact verbatim source sentence(s) for every item.
   - [x] Prohibition of external knowledge or unmentioned facts.
3. [x] Implement grounding validator (`src/pipeline/2-digest/validate-digest-grounding.ts`):
   - [x] Validates against Zod schema.
   - [x] Verifies source sentences are verbatim substrings of original article text.
4. [x] Implement database persistence in `src/db/queries-digests.ts` (`insertDigest`, `getDigestByArticleId`, article status updating).
5. [x] Implement digest generator (`src/pipeline/2-digest/generate-digest.ts`) with bounded retry loop (up to 2 retries) with targeted error feedback.
6. [x] Record failures explicitly with `status: 'failed'` in the `digests` and `articles` tables.
7. [x] Implement Inngest job (`src/jobs/generate-digest-job.ts`) with stage boundary logging:
   `[digest] article=123 items=6 retries=1 status=success`.
8. [x] Author end-to-end verification script (`src/pipeline/2-digest/verify-digest.ts`).

## Done When
⛔
- [x] Every item has kind, text and verbatim source sentence(s) (verified: 6 items extracted via Gemini Flash with 100% verbatim substring provenance).
- [x] A deliberately bad output gets retried and then shows as failed in the database (verified: 3 attempts executed, failure diagnostic persisted in Supabase).
- [ ] Stop and wait for user approval.
