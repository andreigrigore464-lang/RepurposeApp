# Phase 8: User Interface & Review/Export Workflow

## Goal
Build the calm editorial web interface: Brand Kit management, Feeds page, Drafts Inbox, Review & Editing screen (with side-by-side grounding provenance, slot editing, regeneration, and live preview), and Asset Export. Follow design skills (`ui-ux-pro-max` and `impeccable`).

## Tasks
1. [x] Activate and consult workspace design skills (`impeccable` and `ui-ux-pro-max`) for editorial aesthetic direction (`Operate` mode, calm typography, neutral palette).
2. [x] Build Brand Kit configuration screen (`/brand`):
   - Palette pickers (Primary, Secondary, Background, Text) with live hex inputs.
   - Curated SIL typography pairing selector (`Playfair Display`, `Inter`).
   - Editorial voice and tone guidelines textarea.
   - Live theme preview card with instant visual updates.
   - Persistence via `/api/brand` endpoint and `queries-brand-kit.ts`.
3. [x] Build Feeds management screen (`/feeds`):
   - List active feeds with verification status (`unverified` default per Rule 4).
   - Add new RSS/Atom feed form with instant table refresh.
   - Manual article URL ingest form triggering extraction via `/api/ingest`.
4. [x] Build Drafts Inbox (`/inbox`):
   - Status filters (`All`, `Ready for Review`, `Processing`) and live search.
   - Clean editorial table displaying article headline, source URL, date, and grounded item counts.
   - Clickable format pills (`text-post`, `thread`, `card`, `carousel`) linking directly to review workbench.
5. [x] Build Review & Editing workbench (`/review/[formatId]`):
   - Side-by-side view:
     - **Left Column:** Platform variant switcher (`LinkedIn`, `X`, `Instagram`, `Facebook`, `Threads`), live character counter vs platform character limits, directly editable content textarea, and interactive Konva live canvas preview with carousel slide stepper.
     - **Right Column:** Grounding Provenance Inspector displaying 100% verbatim source sentences in emerald quote blocks with copy buttons and kind tags.
6. [x] Build Asset Export system (`/api/export`):
   - One-click copy post text button with checkmark confirmation feedback.
   - Download high-res PNG for cards.
   - Download multi-page PDF for carousels.

## Done When
⛔
- [x] The full editorial loop is operable: Ingest feed/URL -> View drafts -> Edit slots with grounding shown -> Preview live canvas -> Export copy and image/PDF assets.
- [x] All routes verified and built cleanly in Next.js production build (`npm run build`).
- Stop and wait for user approval.
