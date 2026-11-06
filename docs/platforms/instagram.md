# Platform Constraints: Instagram

## 1. Platform Identity
- **Identifier:** `instagram`
- **Supported Formats:** `text-post` (with background card image), `card`, `carousel`
- **Native Delivery Method:** Copy caption text to clipboard, download PNG image (for card) or ZIP package of PNGs (for carousel).

---

## 2. Technical Constraints

| Property | Limit / Rule | Notes |
|---|---|---|
| **Max Caption Characters** | 2,200 characters | Optimal engagement target: 600–1,200 characters. |
| **Visible Truncation (The Fold)** | ~125 characters | Hook must deliver its punchline before "...more". |
| **Hashtags** | 3 to 10 hashtags | Placed at the very bottom of the caption after separator line breaks. |
| **Card Aspect Ratio** | 1080x1080 (1:1) or 1080x1350 (4:5) | 1080x1350 (4:5 portrait) occupies maximum mobile feed screen real estate. |
| **Carousel Slide Limits** | 2 to 10 images | Handled as sequential PNG images zipped for download. |
| **Hyperlinks** | Not clickable in captions | Must use "Link in bio" or "Read at [canonical URL]" text. |

---

## 3. Formatting & Styling Rules
- Visual-first medium: caption must complement, not repeat verbatim, the text displayed on the card or carousel slide.
- Clean spacing: Preserve blank line spacers to avoid Instagram caption wall-of-text collapse.

