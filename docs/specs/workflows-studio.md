# Workflows Studio (`/feeds`)

This document captures the implementation of the Publishing Workflows Studio built in this session.

---

## What Was Built

We replaced the legacy feed settings with an interactive Workflows Studio on `/feeds`.

### 1. Workflow Builder Modal (`src/components/feeds/workflow-builder-modal.tsx`)
* **Pop-up dialog over the page** (not a separate route).
* **Custom workflow naming:** Users name their workflows (e.g. "TechCrunch Daily"), with smart auto-suggest from the feed domain.
* **Feed input with smart discovery:** Accepts publication homepages and resolves RSS feeds automatically.
* **Visual template picker:** Users select an existing brand template for cards and carousels.
* **Format selection:** Toggle pills for `text-post`, `thread`, `card`, `carousel`.
* **Custom poll rates:** User selects polling interval (`15m`, `1h`, `6h`, `24h`).

### 2. Workflow Card (`src/components/feeds/workflow-card.tsx`)
* Visual card displaying:
  * Workflow title and source feed link.
  * Assigned template chip.
  * Badges for all enabled formats.
  * Active / Paused toggle switch.
  * Options dropdown: **Edit**, **Duplicate**, **Delete**.
  * Toggle button to expand/collapse the live feed stream drawer.

### 3. Live Feed Stream Drawer (`src/components/feeds/feed-stream-drawer.tsx`)
* Expandable drawer directly underneath a workflow card.
* Fetches and displays recent live articles from that feed.
* Provides a 1-click `[ Repurpose ]` button per article to trigger the pipeline immediately.

### 4. Quick Repurpose Bar (`src/components/feeds/quick-repurpose-bar.tsx`)
* Bar at the top of `/feeds` allowing users to paste a one-off URL or raw text.
* Includes a dropdown to route that article through any of the user's configured workflows (applying that workflow's template and enabled formats).

### 5. Backend & Storage
* **API Route:** `src/app/api/workflow/route.ts` handles create, update, toggle active, duplicate, and delete actions.
* **Data Helper:** `WorkflowRecord` in `src/db/queries-brand-kit.ts`.

---

## Settled Decisions
* **No AI Slop:** No robotic buzzwords ("studio blueprints", "delve", "supercharge"). Copy is direct, human, and editorial.
* **No pre-seeded fake workflows:** Workflows are created explicitly by the user.
