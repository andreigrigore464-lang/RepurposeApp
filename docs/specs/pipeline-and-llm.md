# LLM Engine & Pipeline Reliability

This document captures the LLM provider integration, rate-limit backoff, and failure recovery built in this session.

---

## What Was Built

### 1. Groq Provider Integration (`src/llm/groq-provider.ts`)
* Implemented `GroqLlmProvider` adhering strictly to the `LlmProvider` interface.
* Uses Groq's OpenAI-compatible completions API with model `openai/gpt-oss-120b` (or `GROQ_MODEL`).
* Swappable via `LLM_PROVIDER=groq` in `.env.local`.

### 2. Rate-Limit Handling (429 TPM Backoff)
* Implemented `fetchGroqWithBackoff`:
  * Parses `Retry-After` HTTP headers and regex-matches `try again in Xs` in Groq error bodies.
  * Pauses execution with an added safety buffer (+1.5s) before retrying (up to 3 retries).
* Added sequential polling pacing in `src/pipeline/1-ingest/poll-feed.ts`:
  * Processes ingested feed articles sequentially with a 2-second delay between items to avoid blasting the token-per-minute (TPM) limit.

### 3. Explicit Failure State & Recovery
* **Problem fixed:** Failed digest or format generation calls previously left articles in an indefinite "Processing..." spinner.
* **Pipeline fix (`src/pipeline/run-article-pipeline.ts`):** 
  * If digest extraction or format generation throws an error after bounded retries, `articles.status` is explicitly set to `"failed"`.
* **Inbox fix (`src/components/inbox/inbox-table.tsx`):**
  * Displays a visible `Generation failed` badge with an immediate `[ Retry ]` button so users can re-run the pipeline without restarting the server.

---

## Settled Decisions
* **Groq as Dev Harness:** Groq was added to provide free, high-speed inference to verify pipeline plumbing and UI interactions without exhausting quotas.
* **Output Quality & Production:** Groq open-source outputs are formulaic and struggle with non-English nuance (e.g. Romanian articles). Because the LLM layer is decoupled behind `LlmProvider`, production copywriting quality will be achieved by setting `LLM_PROVIDER=anthropic` (Claude 3.5 Sonnet) or `openai` (GPT-4o) with zero engine changes.
