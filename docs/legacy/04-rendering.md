# 04 — Rendering Specification (Template JSON & Konva)

## 1. Overview & Core Principles

Visual content (single cards and multi-slide carousels) is rendered deterministically using a custom JSON template system.
1. **Single Source of Truth:** A single JSON template defines visual layout, geometry, typography, and dynamic slot bindings.
2. **Pixel-Perfect Parity:** The exact same layout calculations and Konva scene trees run in the browser for client preview and on the Node server for final export generation.
3. **No Drag-and-Drop Editor:** Templates are handwritten, versioned JSON definitions.
4. **Strict Node Runtime Requirement:** Server-side Konva requires the native `canvas` package and registered fonts. Server rendering must run strictly in a Node.js runtime environment (e.g. Inngest job or Node server action), never on Edge or Vercel serverless without native canvas binaries.

---

## 2. Template JSON Schema Specification

A template consists of canvas dimensions, default color and font variables, and an array of pages containing positioned elements.

```typescript
export interface TemplateSchema {
  id: string;
  name: string;
  format: "card" | "carousel";
  dimensions: {
    width: number;  // e.g. 1080
    height: number; // e.g. 1080 (square) or 1350 (portrait 4:5)
  };
  pages: TemplatePage[];
}

export interface TemplatePage {
  page_index: number;
  background: {
    color?: string; // fallback color or theme token (e.g. "$brand_background")
    image_url?: string;
  };
  elements: TemplateElement[];
}

export type TemplateElement =
  | TextElement
  | ImageElement
  | ShapeElement;

interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  slot?: string;            // e.g., "headline", "body", "kicker", "author"
  default_text?: string;
  font_family?: string;    // e.g., "$font_heading", "$font_body", or "Inter"
  font_size: number;
  font_weight?: "normal" | "bold" | "600" | "700" | "800";
  line_height?: number;
  letter_spacing?: number;
  text_align?: "left" | "center" | "right";
  color?: string;          // theme token or hex
  max_lines?: number;
  auto_shrink_font?: boolean; // if true, decreases font size to fit bounds
}

export interface ImageElement extends BaseElement {
  type: "image";
  slot?: string;            // e.g., "article_featured_image", "logo"
  default_url?: string;
  border_radius?: number;
  fit?: "cover" | "contain";
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape_type: "rect" | "circle" | "line";
  fill?: string;
  stroke?: string;
  stroke_width?: number;
  border_radius?: number;
}
```

---

## 3. Slot Binding Resolution

When rendering a template for a given format output:
1. The renderer receives:
   - The `TemplateSchema`.
   - The `slots` object from the `format_outputs` record (e.g., `{ headline: "...", kicker: "..." }`).
   - The brand kit values (primary color, secondary color, font headings, logo URL).
2. For each element with a `slot`:
   - If `element.slot` exists in `slots`, replace `default_text` or `default_url` with the resolved value.
3. For style properties matching token prefixes (e.g., `"$brand_primary"`, `"$font_heading"`):
   - Resolve to the active brand's configured value, with fallbacks to system defaults.

---

## 4. Shared Layout Engine (`src/render/layout/`)

To prevent text overflowing boxes or rendering differently across environments:
- Text measurement is computed using uniform canvas metrics (`ctx.measureText`).
- An auto-fit algorithm optionally scales down font sizes (e.g. from 48px to a minimum of 28px) until text fits within `element.height`.
- This calculation is implemented as a standalone pure function shared by both client and server renderers:
  ```typescript
  // src/render/layout/calculate-text-layout.ts
  export function calculateTextLayout(
    text: string,
    element: TextElement,
    canvasContext: CanvasRenderingContext2D
  ): TextLayoutResult
  ```

---

## 5. Client vs. Server Rendering

### Client-Side Preview (`src/render/render-in-browser.tsx`)
- Uses React-Konva (`Stage`, `Layer`, `Text`, `Image`, `Rect`).
- Renders directly in the browser DOM.
- Instant, responsive preview during slot editing in the review screen.
- Re-renders dynamically when user edits slot text in the review drawer.

### Server-Side Rendering (`src/render/render-on-server.ts`)
- Runs in Node.js environment using the `canvas` package (`createCanvas`, `loadImage`, `registerFont`).
- Instantiates a headless Konva Stage or draws directly to the node-canvas context.
- Exports raw PNG buffers.
- Multi-page carousels combine rendered PNGs into a multi-page PDF (using `pdf-lib`) for LinkedIn document format, or zip them into a `.zip` archive for Instagram/Threads.

---

## 6. MVP Shipped Templates

1. **Card Template (`src/render/templates/default-card.json`):**
   - 1080 x 1080 square.
   - Slots: `kicker`, `headline`, `subhead`, `stat_callout`, `attribution`, `brand_logo`.
2. **Carousel Template (`src/render/templates/default-carousel.json`):**
   - 1080 x 1350 vertical (4:5 optimal social aspect ratio).
   - Page 1: Cover slide (kicker, title, subtitle, logo).
   - Page 2–N: Body slides (badge/step, slide title, body copy).
   - Last Page: Conclusion slide (takeaway, CTA, branding).

