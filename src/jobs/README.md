# src/jobs/ — Inngest Background Jobs

This directory defines background jobs orchestrated by Inngest.

## Rules
- Each background job is defined in its own small, focused file.
- Jobs contain **zero business logic**; they strictly invoke pipeline functions and update database state.
- Structured stage boundary logging is enforced at each step (`[stage] ...`).

## Files
- `inngest-client.ts` — The Inngest application client instance.
- `article-pipeline-job.ts` — Unified Inngest background job running Digest -> Formats -> Adapt with per-brand and per-article concurrency limits.
- `dispatch-pipeline.ts` — Dispatcher utility decoupling HTTP endpoints from pipeline execution with local sync fallback.
- `poll-feeds-job.ts` — Scheduled/on-demand Inngest job for brand feed polling.

