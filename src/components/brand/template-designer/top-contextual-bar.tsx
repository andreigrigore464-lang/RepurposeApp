"use client";

/**
 * Top Contextual Property Bar
 * Authentic Canva-style horizontal toolbar positioned above the canvas.
 * Dynamically displays tools for the selected element (Text, Shapes, Images, Video, Captions).
 * System Layer: ui / brand / template-designer
 */

import React from "react";
import {
  TemplateElement,
  TextElement,
  ShapeElement,
  ImageElement,
  VideoElement,
  CaptionsElement,
} from "@/render/template-schema";
import { BrandTheme } from "@/render/layout/resolve-slots";
import { getFriendlyLabel } from "./layer-utils";

interface TopContextualBarProps {
  element: TemplateElement | null;
  theme: BrandTheme;
  onChange: (updated: TemplateElement) => void;
  onDelete: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
}

export function TopContextualBar({
  element,
  theme,
  onChange,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
}: TopContextualBarProps): React.JSX.Element {
  if (!element) {
    return (
      <div className="h-12 bg-white border-b border-zinc-200 px-6 flex items-center justify-between text-xs text-zinc-500 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-zinc-700">Canvas Ready</span>
          <span className="text-zinc-400">·</span>
          <span>Click any element to edit styling, or add elements from the left sidebar</span>
        </div>
        <div className="text-[11px] font-mono text-zinc-400">
          Click + Drag to Move · Drag Corners to Resize · Shift for Aspect
        </div>
      </div>
    );
  }

  const { title } = getFriendlyLabel(element);
  const isText = element.type === "text";
  const isShape = element.type === "shape";
  const isImage = element.type === "image";
  const isVideo = element.type === "video";
  const isCaptions = element.type === "captions";

  const textEl = isText ? (element as TextElement) : null;
  const shapeEl = isShape ? (element as ShapeElement) : null;
  const imgEl = isImage ? (element as ImageElement) : null;
  const vidEl = isVideo ? (element as VideoElement) : null;
  const capEl = isCaptions ? (element as CaptionsElement) : null;

  return (
    <div className="h-12 bg-white border-b border-zinc-200 px-4 flex items-center justify-between gap-3 text-xs select-none">
      {/* Left: Element Label */}
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-200 shrink-0">
        <span className="font-semibold text-zinc-900 truncate max-w-[150px]">{title}</span>
        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
          {element.type}
        </span>
      </div>

      {/* Center: Contextual Tools */}
      <div className="flex items-center gap-3 flex-1">
        {/* TEXT TOOLS */}
        {textEl && (
          <div className="flex items-center gap-2">
            {/* Font Family */}
            <select
              value={textEl.font_family || "Inter"}
              onChange={(e) => onChange({ ...textEl, font_family: e.target.value })}
              className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-medium text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              <option value="Inter">Inter (Clean Sans)</option>
              <option value="Playfair Display">Playfair Display (Serif)</option>
              <option value="Merriweather">Merriweather (Book Serif)</option>
              <option value="Cinzel">Cinzel (Luxury)</option>
              <option value="Montserrat">Montserrat (Bold Sans)</option>
            </select>

            {/* Font Size Stepper */}
            <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50 overflow-hidden h-8">
              <button
                type="button"
                onClick={() => onChange({ ...textEl, font_size: Math.max(10, textEl.font_size - 2) })}
                className="px-2 h-full text-zinc-600 hover:bg-zinc-200 font-bold"
              >
                -
              </button>
              <span className="px-2 text-xs font-mono font-semibold text-zinc-800 min-w-[32px] text-center">
                {textEl.font_size}
              </span>
              <button
                type="button"
                onClick={() => onChange({ ...textEl, font_size: textEl.font_size + 2 })}
                className="px-2 h-full text-zinc-600 hover:bg-zinc-200 font-bold"
              >
                +
              </button>
            </div>

            {/* Color Swatch */}
            <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors" title="Text Color">
              <span className="text-[11px] text-zinc-500">Color:</span>
              <input
                type="color"
                value={textEl.color || theme.textColor}
                onChange={(e) => onChange({ ...textEl, color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-300"
              />
            </label>

            <div className="h-4 w-px bg-zinc-200" />

            {/* Formatting Group: B, I, U, aA */}
            <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50 overflow-hidden h-8">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...textEl,
                    font_weight: textEl.font_weight === "bold" ? "normal" : "bold",
                  })
                }
                className={`px-2.5 h-full font-bold ${
                  textEl.font_weight === "bold" ? "bg-zinc-200 text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...textEl,
                    font_style: textEl.font_style === "italic" ? "normal" : "italic",
                  })
                }
                className={`px-2.5 h-full italic font-serif ${
                  textEl.font_style === "italic" ? "bg-zinc-200 text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
                }`}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...textEl,
                    text_decoration: textEl.text_decoration === "underline" ? "none" : "underline",
                  })
                }
                className={`px-2.5 h-full underline ${
                  textEl.text_decoration === "underline" ? "bg-zinc-200 text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
                }`}
                title="Underline"
              >
                U
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...textEl,
                    text_transform: textEl.text_transform === "uppercase" ? "none" : "uppercase",
                  })
                }
                className={`px-2.5 h-full text-[11px] font-mono ${
                  textEl.text_transform === "uppercase" ? "bg-zinc-200 text-zinc-900 font-bold" : "text-zinc-600 hover:text-zinc-900"
                }`}
                title="Toggle Uppercase"
              >
                aA
              </button>
            </div>

            {/* Align Group */}
            <div className="flex items-center border border-zinc-200 rounded-md bg-zinc-50 overflow-hidden h-8">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  type="button"
                  onClick={() => onChange({ ...textEl, text_align: align })}
                  className={`px-2.5 h-full ${
                    (textEl.text_align || "left") === align
                      ? "bg-zinc-200 text-zinc-900 font-bold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                  title={`Align ${align}`}
                >
                  {align === "left" && "⇤"}
                  {align === "center" && "≡"}
                  {align === "right" && "⇥"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SHAPE TOOLS */}
        {shapeEl && (
          <div className="flex items-center gap-3">
            {/* Fill Color */}
            <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors" title="Fill Color">
              <span className="text-[11px] text-zinc-500">Fill:</span>
              <input
                type="color"
                value={shapeEl.fill || theme.secondaryColor}
                onChange={(e) => onChange({ ...shapeEl, fill: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-300"
              />
            </label>

            {/* Stroke Color */}
            <label className="flex items-center gap-1.5 cursor-pointer px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors" title="Border / Stroke Color">
              <span className="text-[11px] text-zinc-500">Stroke:</span>
              <input
                type="color"
                value={shapeEl.stroke || "#000000"}
                onChange={(e) => onChange({ ...shapeEl, stroke: e.target.value, stroke_width: shapeEl.stroke_width || 2 })}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-300"
              />
            </label>

            <select
              value={shapeEl.stroke_width || 0}
              onChange={(e) => onChange({ ...shapeEl, stroke_width: Number(e.target.value) })}
              className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-800"
              title="Stroke Width"
            >
              <option value="0">0px</option>
              <option value="1">1px</option>
              <option value="2">2px</option>
              <option value="4">4px</option>
              <option value="6">6px</option>
            </select>

            <select
              value={shapeEl.stroke_dash || "solid"}
              onChange={(e) => onChange({ ...shapeEl, stroke_dash: e.target.value as any })}
              className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-800"
              title="Stroke Pattern"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>

            {shapeEl.shape_type === "rect" && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500">Radius:</span>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={shapeEl.border_radius || 0}
                  onChange={(e) => onChange({ ...shapeEl, border_radius: Number(e.target.value) })}
                  className="w-14 h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-mono text-zinc-800"
                />
              </div>
            )}
          </div>
        )}

        {/* IMAGE TOOLS */}
        {imgEl && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Corner Radius:</span>
              <input
                type="number"
                min="0"
                max="120"
                value={imgEl.border_radius || 0}
                onChange={(e) => onChange({ ...imgEl, border_radius: Number(e.target.value) })}
                className="w-14 h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-mono text-zinc-800"
              />
            </div>
            <select
              value={imgEl.fit || "cover"}
              onChange={(e) => onChange({ ...imgEl, fit: e.target.value as any })}
              className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-800"
            >
              <option value="cover">Cover (Fill Frame)</option>
              <option value="contain">Contain (Fit Whole Image)</option>
            </select>
          </div>
        )}

        {/* VIDEO TOOLS */}
        {vidEl && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-zinc-500">Framing:</span>
            <select
              value={vidEl.framing_mode || "ai_face_focus"}
              onChange={(e) => onChange({ ...vidEl, framing_mode: e.target.value as any })}
              className="h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-800 font-medium"
            >
              <option value="ai_face_focus">Face Focus</option>
              <option value="dynamic_tracking">Dynamic Tracking</option>
              <option value="blurred_stack">Blurred Stack</option>
              <option value="cover">Cover</option>
            </select>
          </div>
        )}

        {/* CAPTIONS TOOLS */}
        {capEl && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-600 cursor-pointer">
              Text:
              <input
                type="color"
                value={capEl.primary_color || "#FFFFFF"}
                onChange={(e) => onChange({ ...capEl, primary_color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-300"
              />
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-600 cursor-pointer">
              Highlight:
              <input
                type="color"
                value={capEl.highlight_color || "#FFDE00"}
                onChange={(e) => onChange({ ...capEl, highlight_color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-300"
              />
            </label>
          </div>
        )}

        <div className="h-4 w-px bg-zinc-200" />

        {/* UNIVERSAL CONTROLS: Shadow, Opacity, Rotation */}
        <div className="flex items-center gap-2.5">
          {/* Shadow Button */}
          <button
            type="button"
            onClick={() => {
              const hasShadow = Boolean(element.shadow_color);
              onChange({
                ...element,
                shadow_color: hasShadow ? undefined : "rgba(0,0,0,0.35)",
                shadow_blur: hasShadow ? undefined : 14,
                shadow_offset_y: hasShadow ? undefined : 6,
              });
            }}
            className={`px-2.5 h-8 rounded-md text-xs border font-medium transition-colors ${
              element.shadow_color
                ? "bg-zinc-900 border-zinc-900 text-white font-semibold"
                : "border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
            title="Toggle Drop Shadow"
          >
            Shadow
          </button>

          {/* Opacity */}
          <div className="flex items-center gap-1.5" title="Opacity">
            <span className="text-[11px] text-zinc-500">Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={element.opacity ?? 1}
              onChange={(e) => onChange({ ...element, opacity: Number(e.target.value) })}
              className="w-16 h-1.5 accent-zinc-800 cursor-pointer"
            />
            <span className="text-[10px] font-mono text-zinc-600 w-7 text-right">
              {Math.round((element.opacity ?? 1) * 100)}%
            </span>
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-1" title="Rotation Angle">
            <span className="text-[11px] text-zinc-500">Rotate:</span>
            <input
              type="number"
              min="-180"
              max="180"
              value={element.rotation || 0}
              onChange={(e) => onChange({ ...element, rotation: Number(e.target.value) })}
              className="w-14 h-8 rounded-md border border-zinc-200 bg-zinc-50 px-2 text-xs font-mono text-zinc-800"
            />
            <span className="text-[10px] text-zinc-500">°</span>
          </div>
        </div>
      </div>

      {/* Right: Layer Ordering & Delete */}
      <div className="flex items-center gap-1.5 pl-3 border-l border-zinc-200 shrink-0">
        <button
          type="button"
          onClick={() => onBringForward(element.id)}
          className="p-1.5 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          title="Bring Forward"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onSendBackward(element.id)}
          className="p-1.5 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          title="Send Backward"
        >
          ▼
        </button>
        <button
          type="button"
          onClick={() => onDelete(element.id)}
          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-1"
          title="Delete element"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
