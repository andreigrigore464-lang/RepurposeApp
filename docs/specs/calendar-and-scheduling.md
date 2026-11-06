# Editorial Calendar & Scheduling Specification (`/calendar`)

## 1. Overview & Purpose

The Editorial Calendar module provides editorial users with a calm, high-retention schedule and dispatch cockpit. Rather than auto-publishing without oversight—which small creators and editorial teams often distrust—it establishes a deliberate, review-gated scheduling flow (exploiting the IKEA effect) with a near-zero friction manual posting hand-off.

The feature consists of:
1. **Review Workbench Scheduling (`src/components/review/schedule-modal.tsx`):** A schedule trigger in `/review/[formatId]` offering **Simple Mode** (schedules all formats of the article on one date) and **Advanced Mode** (schedules individual formats with exact hours).
2. **Calendar Workspace (`/calendar`, `src/components/calendar/calendar-workspace.tsx`):** A monthly calendar grid with status indicators (`Scheduled` vs. `Published`), prev/next navigation, and a pinned **Today's Posts** sidebar.
3. **Fullscreen Day View (`src/components/calendar/day-fullscreen-modal.tsx`):** An expanded modal view into any selected day with deep-dive post cards, platform tabs, unschedule triggers, and publish actions.
4. **"Ready to Publish" Dispatch & Trust Poll (`src/components/calendar/publish-post-modal.tsx`):** 1-click formatted copy, visual media asset downloads (PNG/PDF), publication marking, and a 1-time trust poll to gauge user sentiment toward automated account publishing.
5. **Live Navigation Badge (`src/components/layout/nav-header.tsx`):** An in-app badge on the `Calendar` nav link showing the count of posts due today.

---

## 2. Architecture & Data Model

### A. Persistence Strategy
To prevent schema drift and keep migrations lightweight for the MVP:
- `format_outputs.status` is extended to:
  `"draft" | "reviewed" | "scheduled" | "published" | "exported" | "failed"`
- Scheduling metadata is persisted in `format_outputs.slots_data`:
  - `scheduled_at`: ISO date/timestamp string (`YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`).
  - `scheduled_has_time`: `boolean` (`true` if scheduled via Advanced Mode with hours; `false` if scheduled via Simple Mode).
  - `published_at`: ISO timestamp string set when the user marks the post as published.
- The 1-time Auto-Posting Trust Poll vote is stored in `brand_kits.custom_templates.autoPostTrustVote`:
  ```json
  {
    "vote": "yes" | "no",
    "votedAt": "2026-11-05T18:22:57.630Z"
  }
  ```
- Documented in migration `supabase/migrations/00004_add_calendar_scheduling.sql`.

### B. Single-Responsibility Query Module (`src/db/queries-calendar.ts`)
- `scheduleFormatOutputs(brandId, items: ScheduleOutputPayload[])`: Updates `format_outputs.status` to `"scheduled"` and sets `slots_data.scheduled_at` and `slots_data.scheduled_has_time`.
- `unscheduleFormatOutput(brandId, formatOutputId)`: Reverts `format_outputs.status` to `"draft"` and deletes scheduling timestamps from `slots_data`.
- `markFormatOutputPublished(brandId, formatOutputId)`: Updates `format_outputs.status` to `"published"` and sets `slots_data.published_at`.
- `listScheduledOutputsForBrand(brandId)`: Fetches all scheduled and published format outputs joined with parent `articles` and child `platform_variants`.
- `getAutoPostTrustVote(brandId)`: Reads `autoPostTrustVote` from `brand_kits.custom_templates`.
- `saveAutoPostTrustVote(brandId, vote: "yes" | "no")`: Persists the trust vote in `brand_kits.custom_templates`.

---

## 3. API Endpoints (`/api/calendar`)

File: [src/app/api/calendar/route.ts](file:///d:/Work/RepurposeApp/src/app/api/calendar/route.ts)

- **`GET /api/calendar`**
  - Returns `{ success: true, items: ScheduledOutputItem[], dueTodayCount: number, trustVote: { hasVoted: boolean, vote: "yes" | "no" | null, votedAt: string | null } }`.
  - Calculates `dueTodayCount` by comparing the local date part (`YYYY-MM-DD`) of `slots_data.scheduled_at` against today for items with `status === "scheduled"`.
- **`POST /api/calendar`**
  - Dispatches actions based on `body.action`:
    - `action: "schedule"`:
      - **Simple Mode (`mode: "simple"`):** Takes `articleId` and `scheduledDate`, looks up all sibling format outputs for that article via `listFormatOutputsForArticle`, and schedules them together.
      - **Advanced Mode (`mode: "advanced"`):** Takes an array of `{ formatOutputId, scheduledAt, hasTime }`.
    - `action: "unschedule"`: Takes `{ formatOutputId }`.
    - `action: "publish"`: Takes `{ formatOutputId }`.
    - `action: "vote_trust"`: Takes `{ vote: "yes" | "no" }`.

---

## 4. UI Components

### A. Review Workbench Schedule Modal
File: [src/components/review/schedule-modal.tsx](file:///d:/Work/RepurposeApp/src/components/review/schedule-modal.tsx)
- Triggered by `[ Schedule ]` button in [format-workbench.tsx](file:///d:/Work/RepurposeApp/src/components/review/format-workbench.tsx).
- **Simple Mode (Default):**
  - Minimal date picker (`YYYY-MM-DD`), defaulting to tomorrow.
  - Displays badges for all formats generated for the article (`siblingFormats`).
  - Schedules entire article output bundle to the target date.
- **Advanced Mode (Toggle):**
  - Top-right toggle pill reveals per-format configuration.
  - Each format card has an inclusion checkbox, separate date picker, and hour/minute time picker (`HH:mm`).

### B. Calendar Workspace & Monthly Grid
Files: [src/app/calendar/page.tsx](file:///d:/Work/RepurposeApp/src/app/calendar/page.tsx), [src/components/calendar/calendar-workspace.tsx](file:///d:/Work/RepurposeApp/src/components/calendar/calendar-workspace.tsx)
- Server-rendered page fetching initial scheduled outputs and trust vote status.
- **Calendar Grid:**
  - 35 or 42 grid cells showing day numbers, current month vs. adjacent month shading, and "Today" highlighting.
  - Scheduled items appear as compact pills showing format name and a checkmark if already published.
  - Clicking any day cell opens the **Fullscreen Day View**.
- **Pinned "Today's Posts" Sidebar:**
  - Displays count and summary cards for all items scheduled for the current date.
  - Includes a quick `Ready to Post →` button per item and an `Open Today in Fullscreen View →` trigger.

### C. Fullscreen Day Detail View
File: [src/components/calendar/day-fullscreen-modal.tsx](file:///d:/Work/RepurposeApp/src/components/calendar/day-fullscreen-modal.tsx)
- Fullscreen modal overlay for deep inspection of any day's queue.
- Shows total posts, scheduled count, and published count.
- Each post card renders:
  - Format kind pill and scheduled hour (if set via Advanced Mode).
  - Article title and link.
  - Copy preview snippet.
  - Target platform badges (`linkedin`, `x`, `instagram`).
  - Actions: `Edit in Review ↗`, `Unschedule` (with confirmation), and `Ready to Post →`.

### D. "Ready to Publish" Dispatch & Trust Poll Modal
File: [src/components/calendar/publish-post-modal.tsx](file:///d:/Work/RepurposeApp/src/components/calendar/publish-post-modal.tsx)
- **Zero-Friction Publishing Controls:**
  - Platform tabs to view adapted copy per platform.
  - 1-click `Copy Post Text` with clipboard feedback.
  - 1-click `Download PNG` (for `card`) or `Download Carousel PDF` (for `carousel`).
  - `Mark as Published ✓` button updates the database state to `"published"`.
- **Auto-Posting Trust Poll:**
  - Shown prominently above post copy **only if the brand has not voted yet** (`hasVotedTrust === false`).
  - Transparently explains why direct auto-posting is withheld (protecting user account safety and avoiding unvetted AI updates).
  - Collects 1-click vote: `[ Yes, I'd use auto-posting ]` or `[ No, I prefer manual posting ]`.
  - Upon submission, records the vote via `/api/calendar`, provides immediate feedback, and permanently hides the poll on subsequent modal opens.

### E. Navigation Header Badge
File: [src/components/layout/nav-header.tsx](file:///d:/Work/RepurposeApp/src/components/layout/nav-header.tsx)
- Queries `/api/calendar` on mount and pathname change.
- Renders a high-contrast amber pill badge next to `Calendar` when `dueTodayCount > 0`.

