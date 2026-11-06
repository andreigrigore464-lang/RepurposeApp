# Master Templates Dashboard & Visual Designer (`/templates`)

This document captures the implementation of the Master Templates Manager and interactive Visual Template Designer.

---

## What Was Built

We created a visual template system allowing editorial teams to customize graphic cards and multi-slide carousels with drag-and-drop precision, magnetic snapping guides, and live brand styling.

### 1. Templates Dashboard (`src/app/templates/page.tsx` & `src/components/templates/templates-manager.tsx`)
* **Dedicated Route (`/templates`):** Consolidated dashboard for creating, browsing, duplicating, and managing visual master templates.
* **Server-Side Data Loader:** Loads user custom templates and brand kit tokens from Supabase, falling back to bundled default templates (`card-default.json`, `carousel-default.json`).
* **Template Cards:** Displays format badges (`card`, `carousel`), aspect ratio chip (`1:1 Square`, `4:5 Portrait`), active generation default toggle, and last-updated timestamps.
* **Template Lifecycle Actions:**
  * **Edit:** Launches the full-screen visual canvas designer.
  * **Duplicate:** Creates an independent copy with a new UUID and `(Copy)` suffix.
  * **Delete:** Removes the template and persists updated array.
  * **Active Toggle:** Designates the template as the default layout for subsequent generation runs.
* **Empty State:** Guided empty state prompting editorial leads to create their first card or carousel layout.

### 2. Visual Template Designer Orchestrator (`src/components/brand/template-designer/template-designer.tsx`)
* **Full-Screen Workspace:** Interactive layout studio with full-bleed canvas viewport, header controls, archetype tabs, and collapsible tool panels.
* **Header Controls:**
  * Editable template name input.
  * Aspect ratio toggle: `1:1 Square (1080×1080)` vs `4:5 Portrait (1080×1350)`.
  * Save action with live spinner, success feedback, and server error handling.
  * Back button to return to `/templates`.
* **Archetype / Slide Selector:**
  * Single view for `card` formats.
  * 3-archetype stepper for `carousel` formats:
    * **Cover Slide (Page 0):** Hero slide layout (kicker, title, subtitle, swipe indicator).
    * **Takeaway Slide (Page 1 Prototype):** Reusable body slide layout (badge, title, grounded body, divider, footer attribution).
    * **Closing Slide (Page 2 Prototype):** Conclusion layout (summary, call-to-action button/box).
* **Element Layer Stack & Ordering:**
  * Reorder elements via `Bring to Front`, `Send to Back`, `Bring Forward`, and `Send Backward`.
  * Deleting elements updates the active page layout immediately.

### 3. Konva Canvas Stage & Magnetic Snapping (`canvas-stage.tsx` & `snap-calculator.ts`)
* **Client Canvas Stage (`canvas-stage.tsx`):**
  * Built using `react-konva` with dynamic client-only loading (SSR disabled).
  * Direct rendering of shapes (`Rect`, `Circle`, `Line`), text boxes (`KonvaText`), and image containers.
  * Selection handles with interactive Konva `Transformer` for 8-point bounding-box resizing.
* **Magnetic Snap Guide Calculator (`snap-calculator.ts`):**
  * Snapping distance threshold: 8 canvas pixels.
  * **Center Axis Snapping:** Snaps to horizontal and vertical canvas centers.
  * **Safe Margins:** Snaps to 5% outer boundary padding (safe zone for social feeds).
  * **Sibling Alignment:** Snaps to sibling elements' top, bottom, left, right edges and center axes.
  * **Visual Guide Lines:** Renders dashed guide lines during drag and transform interactions.
* **Realistic Editorial Preview (`layer-utils.ts`):**
  * Provides realistic sample headlines, metrics, and body excerpts during editing to ensure typography wrapping matches real-world articles.

### 4. Inspector Sidebar & Content Slot Palette
* **Layers Stack Panel (`layers-panel.tsx`):**
  * Displays elements in z-index order (top of list = topmost canvas layer).
  * Enables selection of obscured or background elements.
* **Content Slot Palette (`slot-palette.tsx`):**
  * Categorized content palette contextual to the active archetype.
  * Grounded slots: `kicker`, `headline`, `stat_callout`, `article_image`, `body_slide.badge`, `body_slide.title`, `body_slide.body`, `closing_slide.title`, `closing_slide.summary`, `closing_slide.call_to_action`.
  * Generic elements: background containers, dividers, and brand accent shapes.
  * 1-click addition onto the canvas with default sizing and typography.
* **Element Properties Panel (`element-properties-panel.tsx`):**
  * Position & Dimensions: X, Y, Width, Height coordinate inputs.
  * Typography Inspector: Font size, line height ratio, font family, font weight, text alignment, and auto-shrink font toggle.
  * Visual Styling: Fill color, stroke color, stroke width, border radius, and opacity.
* **Brand Style & Voice Tab (`brand-style-tab.tsx`):**
  * Live color pickers for primary, secondary, background, and text colors.
  * Typography pairings: heading font and body font selection.
  * Editorial tone guidelines editor with live updates to canvas theme tokens.

### 5. Hierarchical Template Loader (`src/render/load-brand-template.ts`)
* Resolves templates during generation and export according to strict priority:
  1. Explicit `preferredTemplateId` from workflow or user action.
  2. Workflow-assigned template ID (`cardTemplateId` / `carouselTemplateId`).
  3. First active matching format in brand custom templates.
  4. Bundled fallback (`card-default.json` or `carousel-default.json`).

### 6. Dynamic Multi-Slide Carousel Expansion (`src/render/layout/resolve-slots.ts`)
* `expandCarouselTemplate`: Expands the 3 archetype pages (Cover, Body prototype, Closing prototype) into an $N$-page presentation matching the exact `body_slides` count generated for an article.
* Automatically binds elements on page $i$ to `body_slides[i - 1]` with dynamic attribution and page numbering.

### 7. Backend & Storage
* **API Endpoints:**
  * `src/app/api/templates/route.ts`: GET all user templates, POST array updates and brand kit styles.
  * `src/app/api/brand/templates/route.ts`: GET and POST for custom templates on `brand_kits.custom_templates`.
* **Data Access Functions (`src/db/queries-brand-kit.ts`):**
  * `getUserTemplates(brandId)`
  * `saveUserTemplates(brandId, templates)`
  * `updateBrandTemplates(brandId, templates)`

---

## Settled Decisions

1. **Storage in `brand_kits.custom_templates`:**
   Custom templates are stored inside the `custom_templates` JSON column on `brand_kits` table. This avoids creating unneeded relational tables or running disruptive migrations for MVP while maintaining multi-tenant foreign key scoping.
2. **Archetype Prototypes for Carousels:**
   Instead of forcing users to design fixed-length carousels, designers configure 3 archetypes (Cover, Body Takeaway Prototype, Closing). During generation and export, the engine dynamically clones the Body prototype for each extracted slide claim.
3. **Strict Zero-Leakage Grounding:**
   When rendering with real article data, missing optional slots (e.g. `stat_callout`) resolve strictly to `""` rather than falling back to placeholder text. Template defaults are only used in empty design preview mode.
