# src/jobs/ — Inngest Background Jobs

This directory defines background jobs orchestrated by Inngest.

## Rules
- Each background job is defined in its own small, focused file.
- Jobs contain **zero business logic**; they strictly invoke pipeline functions and update database state.
- Structured stage boundary logging is enforced at each step (`[stage] ...`).

## Files
- `inngest-client.ts` — The Inngest application client instance.
- Background job definitions (`poll-feeds-job.ts`, `generate-digest-job.ts`, etc.) will be added in their respective phases.

