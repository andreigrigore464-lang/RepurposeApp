# src/lib/ — Shared Utilities & System Seams

This directory holds core configuration and system-level seams.

## Files
- `current-context.ts` — The single seam providing `accountId` and `brandId`. Seeds default values in MVP and will be the only injection point when multi-user authentication is added later.

