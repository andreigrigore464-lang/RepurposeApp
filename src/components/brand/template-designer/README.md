# src/components/brand/template-designer/ — Visual Template Designer

Interactive drag-and-drop template designer allowing editorial leads to visually customize master layouts for social cards and carousels.

## Files
- `types.ts` — TypeScript types for archetypes, snapping guides, and slot metadata.
- `layer-utils.ts` — Human-friendly layer names, slot categories, and clean realistic sample text.
- `snap-calculator.ts` — Mathematical snap guide calculator for center axes, 5% margins, and sibling alignment.
- `canvas-stage.tsx` — Konva canvas stage with draggable elements, corner resize handles, and visual guide lines.
- `layers-panel.tsx` — Visual layers stack panel with z-index reordering (front/back) and obscured element selection.
- `slot-palette.tsx` — Sidebar palette of available grounded article content slots per layout archetype.
- `element-properties-panel.tsx` — Inspector panel for position, dimensions, font size, color, and layer arrangement.
- `builtin-presets.ts` — Pre-designed editorial template presets (Classic Card, Spotlight Metric, Classic Carousel, Minimalist).
- `template-gallery.tsx` — Template gallery modal for browsing, filtering, and activating master templates.
- `template-designer.tsx` — Main orchestrator managing aspect ratio switching, archetype tabs, layers, and persistence.
