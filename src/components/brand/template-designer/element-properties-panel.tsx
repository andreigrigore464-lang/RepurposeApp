"use client";

/**
 * Element Properties Inspector Panel
 * Allows fine-tuning coordinates, typography size, text alignment, colors, video framing, and karaoke captions.
 * System Layer: ui / brand / template-designer
 */

import React from "react";
import {
  TemplateElement,
  TextElement,
  ShapeElement,
  VideoElement,
  CaptionsElement,
} from "@/render/template-schema";
import { BrandTheme } from "@/render/layout/resolve-slots";
import { getFriendlyLabel } from "./layer-utils";

interface ElementPropertiesPanelProps {
  element: TemplateElement | null;
  theme: BrandTheme;
  onChange: (updated: TemplateElement) => void;
  onDelete: (id: string) => void;
  onBringForward?: (id: string) => void;
  onSendBackward?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onSendToBack?: (id: string) => void;
}

export function ElementPropertiesPanel({
  element,
  theme,
  onChange,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: ElementPropertiesPanelProps): React.JSX.Element {
  if (!element) {
    return (
      <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-sm text-center">
        <p className="text-xs font-medium text-app-ink">No Element Selected</p>
        <p className="text-[11px] text-app-muted mt-1">
          Click any element on the canvas or in the Layers list to inspect coordinates and styling.
        </p>
      </div>
    );
  }

  const isText = element.type === "text";
  const isShape = element.type === "shape";
  const isVideo = element.type === "video";
  const isCaptions = element.type === "captions";

  const textEl = isText ? (element as TextElement) : null;
  const shapeEl = isShape ? (element as ShapeElement) : null;
  const videoEl = isVideo ? (element as VideoElement) : null;
  const captionsEl = isCaptions ? (element as CaptionsElement) : null;

  const { title, category } = getFriendlyLabel(element);

  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-5 shadow-sm space-y-5">
      {/* Element Header with Human-Friendly Name */}
      <div className="flex items-center justify-between border-b border-app-border pb-3">
        <div>
          <h3 className="text-xs font-bold text-app-ink">{title}</h3>
          <p className="text-[10px] text-app-muted mt-0.5 flex items-center gap-1.5 font-mono">
            <span>{category}</span>
            <span>·</span>
            <span className="opacity-60">{element.id}</span>
          </p>
        </div>
        <button
          onClick={() => onDelete(element.id)}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
          title="Remove element from canvas"
        >
          Remove
        </button>
      </div>

      {/* Layer Stacking Order Controls (Front / Back) */}
      <div>
        <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2">
          Layer Arrangement
        </label>
        <div className="grid grid-cols-4 gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => onBringToFront?.(element.id)}
            title="Bring to absolute front"
            className="flex flex-col items-center justify-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-app-ink transition-colors"
          >
            <span className="font-bold">⇈</span>
            <span className="text-[9px] text-app-muted">To Front</span>
          </button>
          <button
            type="button"
            onClick={() => onBringForward?.(element.id)}
            title="Bring one layer forward"
            className="flex flex-col items-center justify-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-app-ink transition-colors"
          >
            <span className="font-bold">↑</span>
            <span className="text-[9px] text-app-muted">Forward</span>
          </button>
          <button
            type="button"
            onClick={() => onSendBackward?.(element.id)}
            title="Send one layer backward"
            className="flex flex-col items-center justify-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-app-ink transition-colors"
          >
            <span className="font-bold">↓</span>
            <span className="text-[9px] text-app-muted">Backward</span>
          </button>
          <button
            type="button"
            onClick={() => onSendToBack?.(element.id)}
            title="Send to absolute back"
            className="flex flex-col items-center justify-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-app-ink transition-colors"
          >
            <span className="font-bold">⇊</span>
            <span className="text-[9px] text-app-muted">To Back</span>
          </button>
        </div>
      </div>

      {/* Geometry: X, Y, Width, Height */}
      <div>
        <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider mb-2">
          Position & Dimensions
        </label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-app-muted block mb-1">X Position</span>
            <input
              type="number"
              value={element.x}
              onChange={(e) =>
                onChange({ ...element, x: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-app-muted block mb-1">Y Position</span>
            <input
              type="number"
              value={element.y}
              onChange={(e) =>
                onChange({ ...element, y: parseInt(e.target.value) || 0 })
              }
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-app-muted block mb-1">Width</span>
            <input
              type="number"
              value={element.width}
              onChange={(e) =>
                onChange({ ...element, width: Math.max(20, parseInt(e.target.value) || 20) })
              }
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-app-muted block mb-1">Height</span>
            <input
              type="number"
              value={element.height}
              onChange={(e) =>
                onChange({ ...element, height: Math.max(20, parseInt(e.target.value) || 20) })
              }
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Video Track Attributes */}
      {isVideo && videoEl && (
        <div className="space-y-3 border-t border-app-border pt-3">
          <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
            Video Track Framing
          </label>

          <div>
            <span className="text-[10px] text-app-muted block mb-1">Framing Mode</span>
            <select
              value={videoEl.framing_mode || "ai_face_focus"}
              onChange={(e) =>
                onChange({ ...videoEl, framing_mode: e.target.value as any })
              }
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs"
            >
              <option value="ai_face_focus">AI Face Auto-Focus (Smart Speaker Center)</option>
              <option value="blurred_stack">Blurred Ambient Stack (Background)</option>
              <option value="cover">Fill & Center Crop</option>
              <option value="contain">Fit Entire 16:9 Frame</option>
              <option value="manual_crop">Manual Coordinate Crop</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-app-muted block mb-1">
                Background Blur ({videoEl.blur_px ?? 0}px)
              </span>
              <input
                type="range"
                min="0"
                max="80"
                step="5"
                value={videoEl.blur_px ?? 0}
                onChange={(e) =>
                  onChange({ ...videoEl, blur_px: parseInt(e.target.value) || 0 })
                }
                className="w-full"
              />
            </div>
            <div>
              <span className="text-[10px] text-app-muted block mb-1">
                Brightness ({Math.round((videoEl.brightness ?? 1) * 100)}%)
              </span>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.05"
                value={videoEl.brightness ?? 1}
                onChange={(e) =>
                  onChange({ ...videoEl, brightness: parseFloat(e.target.value) || 1 })
                }
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Karaoke Captions Attributes */}
      {isCaptions && captionsEl && (
        <div className="space-y-3 border-t border-app-border pt-3">
          <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
            Karaoke Subtitles Styling
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-app-muted block mb-1">Font Family</span>
              <select
                value={captionsEl.font_family || "Anton"}
                onChange={(e) =>
                  onChange({ ...captionsEl, font_family: e.target.value })
                }
                className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-semibold"
              >
                <option value="Anton">Anton (Bold & Punchy)</option>
                <option value="Komika Axis">Komika Axis (Comic / Fun)</option>
                <option value="Montserrat">Montserrat (Clean Editorial)</option>
                <option value="Bebas Neue">Bebas Neue (Tall Classic)</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-app-muted block mb-1">Font Size</span>
              <input
                type="number"
                value={captionsEl.font_size}
                onChange={(e) =>
                  onChange({ ...captionsEl, font_size: parseInt(e.target.value) || 84 })
                }
                className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-app-muted block mb-1">Active Word Highlight</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={captionsEl.highlight_color || "#FFDE00"}
                  onChange={(e) =>
                    onChange({ ...captionsEl, highlight_color: e.target.value })
                  }
                  className="h-7 w-8 rounded border border-app-border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={captionsEl.highlight_color || "#FFDE00"}
                  onChange={(e) =>
                    onChange({ ...captionsEl, highlight_color: e.target.value })
                  }
                  className="w-full rounded border border-app-border bg-app-subtle/40 px-2 py-1 text-[11px] font-mono"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-app-muted block mb-1">Default Word Color</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={captionsEl.primary_color || "#FFFFFF"}
                  onChange={(e) =>
                    onChange({ ...captionsEl, primary_color: e.target.value })
                  }
                  className="h-7 w-8 rounded border border-app-border cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={captionsEl.primary_color || "#FFFFFF"}
                  onChange={(e) =>
                    onChange({ ...captionsEl, primary_color: e.target.value })
                  }
                  className="w-full rounded border border-app-border bg-app-subtle/40 px-2 py-1 text-[11px] font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-app-muted block mb-1">Words per Phrase</span>
              <select
                value={captionsEl.words_per_phrase || 4}
                onChange={(e) =>
                  onChange({ ...captionsEl, words_per_phrase: parseInt(e.target.value) || 4 })
                }
                className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs"
              >
                <option value={2}>2 words (ultra fast)</option>
                <option value={3}>3 words</option>
                <option value={4}>4 words (recommended)</option>
                <option value={6}>6 words (longer lines)</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] text-app-muted block mb-1">Outline Stroke</span>
              <input
                type="number"
                min="0"
                max="16"
                value={captionsEl.outline_width ?? 8}
                onChange={(e) =>
                  onChange({ ...captionsEl, outline_width: parseInt(e.target.value) || 0 })
                }
                className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Text Typography Attributes */}
      {isText && textEl && (
        <div className="space-y-3 border-t border-app-border pt-3">
          <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
            Typography
          </label>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-app-muted block mb-1">Font Size</span>
              <input
                type="number"
                value={textEl.font_size}
                onChange={(e) =>
                  onChange({ ...textEl, font_size: Math.max(10, parseInt(e.target.value) || 12) })
                }
                className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs font-mono"
              />
            </div>
            <div>
              <span className="text-[10px] text-app-muted block mb-1">Alignment</span>
              <select
                value={textEl.text_align || "left"}
                onChange={(e) =>
                  onChange({ ...textEl, text_align: e.target.value as any })
                }
                className="w-full rounded border border-app-border bg-app-subtle/40 px-2.5 py-1 text-app-ink text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Color Attributes */}
      {!isVideo && !isCaptions && (
        <div className="border-t border-app-border pt-3 space-y-2">
          <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
            Quick Brand Colors
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (isText && textEl) onChange({ ...textEl, color: theme.primaryColor });
                if (isShape && shapeEl) onChange({ ...shapeEl, fill: theme.primaryColor });
              }}
              className="flex flex-col items-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-[9px] text-app-muted"
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10 mb-1"
                style={{ backgroundColor: theme.primaryColor }}
              />
              Primary
            </button>
            <button
              type="button"
              onClick={() => {
                if (isText && textEl) onChange({ ...textEl, color: theme.secondaryColor });
                if (isShape && shapeEl) onChange({ ...shapeEl, fill: theme.secondaryColor });
              }}
              className="flex flex-col items-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-[9px] text-app-muted"
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10 mb-1"
                style={{ backgroundColor: theme.secondaryColor }}
              />
              Secondary
            </button>
            <button
              type="button"
              onClick={() => {
                if (isText && textEl) onChange({ ...textEl, color: theme.textColor });
                if (isShape && shapeEl) onChange({ ...shapeEl, fill: theme.textColor });
              }}
              className="flex flex-col items-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-[9px] text-app-muted"
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10 mb-1"
                style={{ backgroundColor: theme.textColor }}
              />
              Text
            </button>
            <button
              type="button"
              onClick={() => {
                if (isText && textEl) onChange({ ...textEl, color: theme.backgroundColor });
                if (isShape && shapeEl) onChange({ ...shapeEl, fill: theme.backgroundColor });
              }}
              className="flex flex-col items-center p-1.5 rounded border border-app-border hover:bg-app-subtle text-[9px] text-app-muted"
            >
              <span
                className="h-4 w-4 rounded-full border border-black/10 mb-1"
                style={{ backgroundColor: theme.backgroundColor }}
              />
              Background
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
