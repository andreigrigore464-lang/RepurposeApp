# src/export/ — Asset Export & Packaging

This directory contains utility functions that package reviewed platform variants for manual export.

## Responsibilities
- Plain text clipboard formatting with platform-specific line breaks and tags.
- PNG image download packaging for card formats.
- Multi-page PDF generation (for LinkedIn document posts) and ZIP archive creation (for Instagram slide sets).
- The engine never publishes directly; all output flows through these export helpers.

