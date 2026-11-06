# Design System: Calm Editorial Tool

## 1. Aesthetic Direction & Tone

This application is built for digital editors, journalists, and publishers.
It must feel like a **calm, focused editorial workbench** — precise, quiet, and typographic.
- **NOT** a generic SaaS template with gradient buttons, cartoon illustrations, aggressive neon accents, or noisy metric charts.
- Generous breathing room, clear typographic hierarchy, subtle borders, and intentional focus on text legibility.
- Grounding provenance (source sentences) rendered with subtle distinction so editors can cross-reference facts effortlessly.

---

## 2. Typography

Clean, neutral, and highly legible across dense editorial text.

| Role | Font Family | Weights | Usage |
|---|---|---|---|
| **Editorial Headings** | `Newsreader` / `Playfair Display` or clean `Geist Sans` | 600, 700 | Review headers, article titles, card headlines |
| **Interface & Data** | `Inter` or `Geist Sans` | 400, 500, 600 | Navigation, labels, metadata, inputs, badges |
| **Source Provenance / Grounding** | `JetBrains Mono` or `Geist Mono` | 400, 500 | Source sentence quotes, character counters, item IDs |

---

## 3. Color Palette

Muted, neutral-leaning palette with a focused editorial ink aesthetic.

### Neutrals (Zinc / Slate Spectrum)
- **Background (App):** `#fbfbfb` (Warm off-white)
- **Surface (Cards, Drawers, Panels):** `#ffffff` (Pure white)
- **Border / Subdued Dividers:** `#e4e4e7` (Zinc 200)
- **Subtle Fill / Hover:** `#f4f4f5` (Zinc 100)
- **Text (Primary):** `#18181b` (Zinc 900 — deep ink, not harsh `#000000`)
- **Text (Secondary / Metadata):** `#71717a` (Zinc 500)
- **Text (Tertiary / Captions):** `#a1a1aa` (Zinc 400)

### Accents & Semantic Signals
- **Accent Primary (Editorial Ink Blue):** `#2563eb` (Blue 600) / `#1d4ed8` (Blue 700 hover)
- **Grounding Provenance Badge:** `#f0fdf4` (Emerald 50) background, `#166534` (Emerald 800) text, `#bbf7d0` border
- **Warning / Truncation Caution:** `#fffbeb` (Amber 50) background, `#b45309` (Amber 700) text
- **Error / Schema Violation:** `#fef2f2` (Red 50) background, `#991b1b` (Red 800) text

---

## 4. Spacing, Geometry & Shadows

- **Grid Unit:** 4px base (spacing tokens: 4px, 8px, 12px, 16px, 24px, 32px, 48px).
- **Border Radius:**
  - Badges & small pills: `4px` or `9999px` (full curve)
  - Cards & panels: `8px` (restrained, modern, not bubbly)
  - Inputs & action buttons: `6px`
- **Shadows:** Minimal, near-flat.
  - Card resting: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  - Active modal / popover: `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`

---

## 5. Core Interface Components

1. **Grounded Source Inspector (Split View):**
   - Left side: Editable format slot (e.g. hook, thread tweet, slide body).
   - Right side: The highlighted verbatim source sentence(s) from the original article with digest item ID badge.
2. **Platform Variant Switcher:**
   - Quiet horizontal tab strip showing target platforms (`LinkedIn`, `X`, `Instagram`, `Facebook`, `Threads`).
   - Shows live character count vs. platform limit badge (e.g., `245 / 280`).
3. **Template Canvas Preview:**
   - Framed canvas container with subtle checkered boundary for transparent elements.
   - Live scaling to fit container with 100% zoom toggle.
4. **Export Action Bar:**
   - Direct copy button with feedback indicator ("Copied!").
   - Asset download button (`Download PNG`, `Download Carousel PDF`).

