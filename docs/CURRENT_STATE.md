# Current System State & Living Specification

> **MANDATORY FOR ALL AGENTS:** 
> Do NOT read legacy files in `docs/legacy/` for current requirements. They represent the historical initial build and are archived.
> Always consult this document and the domain specs in `docs/specs/`.

---

## 1. What Was Built in This Session

### A. Publishing Workflows Studio (`/feeds`)
Replaced legacy feed settings with an interactive Workflows Studio:
* **Workflow Builder Modal (`src/components/feeds/workflow-builder-modal.tsx`):** Pop-up dialog to name workflows, discover RSS feeds, pick brand templates, toggle formats (`text-post`, `thread`, `card`, `carousel`), and set poll rates (`15m`, `1h`, `6h`, `24h`).
* **Workflow Cards (`src/components/feeds/workflow-card.tsx`):** Displays workflow details, template chip, format badges, active/paused toggle, options menu (edit, duplicate, delete), and drawer trigger.
* **Live Feed Stream Drawer (`src/components/feeds/feed-stream-drawer.tsx`):** Expandable drawer showing recent articles from that feed with 1-click `[ Repurpose ]` action.
* **Quick Repurpose Bar (`src/components/feeds/quick-repurpose-bar.tsx`):** Paste bar to route one-off URLs or raw text through any configured workflow.
* **API Route (`src/app/api/workflow/route.ts`):** Complete CRUD endpoints for workflows.
* *Detailed spec:* [docs/specs/workflows-studio.md](file:///d:/Work/RepurposeApp/docs/specs/workflows-studio.md)

### B. LLM Engine & Pipeline Reliability
* **Groq Provider (`src/llm/groq-provider.ts`):** Added Groq provider via `LLM_PROVIDER=groq` with `openai/gpt-oss-120b`.
* **Rate-Limit Backoff:** Implemented `fetchGroqWithBackoff` to handle 429 TPM errors with exponential backoff and `Retry-After` parsing.
* **Sequential Ingest Pacing (`src/pipeline/1-ingest/poll-feed.ts`):** Added a 2-second delay between queued feed articles to avoid TPM spikes.
* **Failure Handling & Inbox Retry:** If digest or format generation fails, `articles.status` is set to `"failed"` in Supabase, and `src/components/inbox/inbox-table.tsx` displays a `Generation failed` badge with an immediate `[ Retry ]` button (eliminating infinite spinners).
* *Detailed spec:* [docs/specs/pipeline-and-llm.md](file:///d:/Work/RepurposeApp/docs/specs/pipeline-and-llm.md)

### C. Master Templates Dashboard & Visual Designer (`/templates`)
Built a dedicated visual customization environment for master card and carousel templates:
* **Templates Manager (`src/app/templates/page.tsx`, `src/components/templates/templates-manager.tsx`):** Central dashboard for listing, creating, duplicating, deleting, and activating custom card/carousel templates with aspect ratio indicators (`1:1 Square`, `4:5 Portrait`).
* **Visual Canvas Designer (`src/components/brand/template-designer/template-designer.tsx`):** Full-screen studio for visual template customization with archetype slide tabs (`Cover`, `Takeaway`, `Closing`).
* **Konva Canvas with Magnetic Snapping (`canvas-stage.tsx`, `snap-calculator.ts`):** Client-side drag-and-drop canvas with 8-point transformer handles, center-axis snapping, 5% feed-safe margin snapping, and sibling element alignment guides.
* **Content Slot Palette & Layers (`slot-palette.tsx`, `layers-panel.tsx`, `element-properties-panel.tsx`):** Grounded content slot library, z-index reordering stack, coordinate and typography inspector.
* **Live Brand Styling (`brand-style-tab.tsx`):** Real-time color palette, font pairing, and voice guideline editing with live canvas token binding.
* **Hierarchical Template Loader (`src/render/load-brand-template.ts`):** Priority resolution supporting preferred template overrides, workflow defaults, and disk fallbacks.
* **Dynamic Multi-Slide Expansion (`src/render/layout/resolve-slots.ts`):** Dynamically clones body slide archetypes to match article slide counts with zero placeholder leakage.
* *Detailed spec:* [docs/specs/template-editor.md](file:///d:/Work/RepurposeApp/docs/specs/template-editor.md)

### D. Editorial Calendar & Scheduling (`/calendar`)
Built the review-to-calendar scheduling flow, monthly agenda view, frictionless dispatch modal, and auto-posting trust poll:
* **Review Schedule Modal (`src/components/review/schedule-modal.tsx`):** Accessible via `[ Schedule ]` in `/review/[formatId]`. Supports **Simple Mode** (schedules all formats of the article on one date) and **Advanced Mode** (toggle revealing individual format dates and exact hours).
* **Calendar Workspace (`src/app/calendar/page.tsx`, `src/components/calendar/calendar-workspace.tsx`):** Monthly grid with day indicators, prev/next navigation, and a pinned **Today's Posts** sidebar.
* **Fullscreen Day View (`src/components/calendar/day-fullscreen-modal.tsx`):** Expands any selected day into a full-page view showing scheduled post cards, platform tabs, format badges, and unschedule/publish actions.
* **Ready to Publish & Trust Poll (`src/components/calendar/publish-post-modal.tsx`):** 1-click text copy, asset downloads (PNG/PDF), and a 1-time auto-posting trust poll to validate user demand for automated posting.
* **Live In-App Notification Badge (`src/components/layout/nav-header.tsx`):** Dynamic badge on the Calendar navigation item showing the count of posts due today.
* **Database & API Layer (`src/db/queries-calendar.ts`, `src/app/api/calendar/route.ts`):** Clean persistence and REST endpoints for calendar state and trust poll sentiment.

---

## 2. Locked Decisions Settled in This Chat

1. **Inbox Redesign Deferred to UI Remaster:** 
   * We evaluated improvements for `/inbox` (mini-card previews, slide-over review drawer, 1-click text copy, batch actions, domain chips).
   * **Decision:** We agreed **not** to build these now and postpone them strictly for the upcoming **UI Remaster** milestone to prevent wasted styling work and broken layouts.
2. **No AI Slop:** 
   * Strict rejection of robotic AI buzzwords ("studio blueprints", "delve", "game-changer", "supercharge"). Copy and UI must be direct, editorial, and human.
3. **No Fake Pre-seeded Workflows:** 
   * Users create and configure their own workflows. Do not generate fake default workflows without user intent.
4. **Groq as Dev Harness:** 
   * Groq is used as a free, high-speed test harness for pipeline plumbing and testing. Production copywriting quality will be achieved by setting `LLM_PROVIDER=anthropic` (Claude 3.5 Sonnet) or `openai` (GPT-4o).

---

## 3. Modular Domain Specs (`docs/specs/`)

* [workflows-studio.md](file:///d:/Work/RepurposeApp/docs/specs/workflows-studio.md) — Workflow builder modal, cards, live drawer, routing, poll intervals.
* [pipeline-and-llm.md](file:///d:/Work/RepurposeApp/docs/specs/pipeline-and-llm.md) — Groq provider, 429 TPM backoff, sequential ingest queue, failure recovery.
* [template-editor.md](file:///d:/Work/RepurposeApp/docs/specs/template-editor.md) — Master templates dashboard, interactive drag-and-drop canvas designer, magnetic snapping, slot palette, and hierarchical template loader.
* [calendar-and-scheduling.md](file:///d:/Work/RepurposeApp/docs/specs/calendar-and-scheduling.md) — Editorial calendar, simple & advanced scheduling modal, fullscreen day view, zero-friction dispatch modal, and auto-posting trust poll.
