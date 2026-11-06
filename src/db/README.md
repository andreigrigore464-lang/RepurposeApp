# src/db/ — Database Access & Queries

This directory contains Supabase client initialization and small, single-responsibility query modules per database table.

## Structure
- `client.ts` — Supabase client initialized via environment variables.
- `queries-accounts.ts` — Account and brand retrieval.
- `queries-brand-kits.ts` — Brand kit visual/voice configuration queries.
- `queries-feeds.ts` — RSS feed creation, polling schedule, and status updates.
- `queries-articles.ts` — Normalized article storage and deduplication lookups.
- `queries-digests.ts` — Grounded digest storage and retrieval.
- `queries-format-outputs.ts` — Format outputs and slot storage.
- `queries-platform-variants.ts` — Adapted platform variant persistence.
- `queries-calendar.ts` — Scheduled format outputs, publication tracking, and auto-posting trust poll votes.
- `queries-waitlist.ts` — Landing page email waitlist captures.

