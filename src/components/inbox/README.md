# Inbox UI Components

This folder contains the client components powering the Drafts & Review Inbox table (`/inbox`).

## Files

- `inbox-table.tsx`: Top-level table shell with search, filter tabs, live auto-polling, and manual feed poll button.
- `inbox-table-row.tsx`: Single row representation handling YouTube/video thumbnails, source type badges, grounded item count, and deletion confirmation.
- `inbox-format-badges.tsx`: Renders individual post formats (`text-post`, `thread`, `card`, `carousel`) and vertical reels (`Reel #1 (0:42)`) with active worker progress indicators and format deletion.

