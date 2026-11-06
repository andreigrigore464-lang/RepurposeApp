# src/app/ — Next.js App Router (UI & Route Handlers)

This directory houses the presentation layer, built with Next.js App Router and React Server Components.

## Guidelines
- Pages and route handlers must remain **thin**; they only handle UI state, user events, and invoke pipeline or database functions.
- Adheres strictly to the calm, typographic editorial workbench aesthetic defined in `docs/design-system.md`.
- No barrel re-exports; components and functions are imported directly from their source files.

