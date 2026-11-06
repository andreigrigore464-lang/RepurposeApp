# Repurpose Studio Components

This folder contains the React components powering the `/repurpose` route, which handles ad-hoc, single-item repurposing of both written articles and long-form video content.

## Files

- `types.ts`: Shared TypeScript interfaces for article previews, video render job progress, and timestamp clips.
- `repurpose-studio.tsx`: Top-level page layout and coordinator for switching between Video Reels mode and Written Article mode.
- `video-repurpose-panel.tsx`: Interactive panel for submitting YouTube URLs or direct video file uploads to Cloudflare R2, along with clip generation settings.
- `video-progress-card.tsx`: Live polling card rendering background worker progress, stage updates, and final video reel download links.
- `article-repurpose-panel.tsx`: Interactive panel for inspecting single article URLs or pasting raw text drafts and routing them through format workflows.

