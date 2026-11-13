"use client";

/**
 * Elements & Shapes Palette Panel
 * Canva-style drawer offering geometric shapes and universal typography presets.
 * System Layer: ui / brand / template-designer
 */

import React from "react";
import { TemplateElement, ShapeElement, TextElement } from "@/render/template-schema";
import { BrandTheme } from "@/render/layout/resolve-slots";

interface ElementsPaletteProps {
  theme: BrandTheme;
  onAddElement: (element: TemplateElement) => void;
}

export function ElementsPalette({
  theme,
  onAddElement,
}: ElementsPaletteProps): React.JSX.Element {
  // Add Shape Handler
  const handleAddShape = (
    shapeType: ShapeElement["shape_type"],
    defaultW: number = 240,
    defaultH: number = 180,
    borderRadius: number = 0
  ) => {
    const newId = `shape-${shapeType}-${Date.now().toString().slice(-4)}`;
    const newShape: ShapeElement = {
      id: newId,
      type: "shape",
      shape_type: shapeType,
      x: 120,
      y: 160,
      width: defaultW,
      height: defaultH,
      fill: theme.secondaryColor,
      border_radius: borderRadius,
      stroke: undefined,
      stroke_width: 0,
    };
    onAddElement(newShape);
  };

  // Add Typography Preset Handler
  const handleAddTypography = (
    textPreset: {
      text: string;
      fontSize: number;
      fontWeight?: "normal" | "bold";
      fontFamily?: string;
      width: number;
      height: number;
      fontStyle?: "normal" | "italic";
    }
  ) => {
    const newId = `text-custom-${Date.now().toString().slice(-4)}`;
    const newText: TextElement = {
      id: newId,
      type: "text",
      default_text: textPreset.text,
      x: 100,
      y: 200,
      width: textPreset.width,
      height: textPreset.height,
      font_size: textPreset.fontSize,
      font_weight: textPreset.fontWeight || "normal",
      font_style: textPreset.fontStyle || "normal",
      font_family: textPreset.fontFamily || theme.fontBody,
      color: theme.textColor,
      text_align: "left",
      line_height: 1.3,
    };
    onAddElement(newText);
  };

  return (
    <div className="space-y-6">
      {/* SHAPES SECTION */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-app-ink">
            Shapes & Containers
          </h4>
          <span className="text-[10px] text-app-muted">Click to add</span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Rectangle */}
          <button
            type="button"
            onClick={() => handleAddShape("rect", 300, 200, 0)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <div className="w-10 h-7 border-2 border-app-ink rounded-none bg-app-subtle group-hover:bg-app-accent/20" />
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Rectangle</span>
          </button>

          {/* Rounded Box */}
          <button
            type="button"
            onClick={() => handleAddShape("rect", 300, 200, 16)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <div className="w-10 h-7 border-2 border-app-ink rounded-lg bg-app-subtle group-hover:bg-app-accent/20" />
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Rounded Box</span>
          </button>

          {/* Circle */}
          <button
            type="button"
            onClick={() => handleAddShape("circle", 200, 200)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <div className="w-8 h-8 border-2 border-app-ink rounded-full bg-app-subtle group-hover:bg-app-accent/20" />
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Circle</span>
          </button>

          {/* Triangle */}
          <button
            type="button"
            onClick={() => handleAddShape("triangle", 220, 200)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <svg className="w-8 h-8 text-app-ink group-hover:text-app-accent" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,3 22,21 2,21" />
            </svg>
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Triangle</span>
          </button>

          {/* Star */}
          <button
            type="button"
            onClick={() => handleAddShape("star", 200, 200)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <svg className="w-8 h-8 text-app-ink group-hover:text-app-accent" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Star</span>
          </button>

          {/* Hexagon */}
          <button
            type="button"
            onClick={() => handleAddShape("hexagon", 220, 220)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <svg className="w-8 h-8 text-app-ink group-hover:text-app-accent" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
            </svg>
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Hexagon</span>
          </button>

          {/* Directional Arrow */}
          <button
            type="button"
            onClick={() => handleAddShape("arrow", 240, 100)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <svg className="w-8 h-8 text-app-ink group-hover:text-app-accent" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10h10V6l7 6-7 6v-4H4z" />
            </svg>
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Arrow</span>
          </button>

          {/* Ribbon Badge */}
          <button
            type="button"
            onClick={() => handleAddShape("badge", 180, 240)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <svg className="w-8 h-8 text-app-ink group-hover:text-app-accent" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="4,2 20,2 20,22 12,18 4,22" />
            </svg>
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Badge</span>
          </button>

          {/* Divider Line */}
          <button
            type="button"
            onClick={() => handleAddShape("line", 320, 0)}
            className="flex flex-col items-center justify-center p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors group"
          >
            <div className="w-10 h-0.5 bg-app-ink rounded group-hover:bg-app-accent" />
            <span className="text-[10px] font-medium text-app-muted mt-2 group-hover:text-app-ink">Divider</span>
          </button>
        </div>
      </div>

      {/* TYPOGRAPHY PRESETS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-app-ink">
            Typography Blocks
          </h4>
          <span className="text-[10px] text-app-muted">Click to add</span>
        </div>

        <div className="space-y-2">
          {/* Main Headline Block */}
          <button
            type="button"
            onClick={() =>
              handleAddTypography({
                text: "Bold Editorial Headline",
                fontSize: 54,
                fontWeight: "bold",
                fontFamily: theme.fontHeading,
                width: 880,
                height: 180,
              })
            }
            className="w-full text-left p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-sm font-bold font-serif text-app-ink group-hover:text-app-accent block">
                Add a Main Headline
              </span>
              <span className="text-[10px] text-app-muted">54px · {theme.fontHeading}</span>
            </div>
            <span className="text-xs text-app-muted group-hover:text-app-ink font-bold">+</span>
          </button>

          {/* Subheading Block */}
          <button
            type="button"
            onClick={() =>
              handleAddTypography({
                text: "Clear contextual subtitle summarizing the findings.",
                fontSize: 32,
                fontWeight: "normal",
                fontFamily: theme.fontBody,
                width: 800,
                height: 120,
              })
            }
            className="w-full text-left p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-medium text-app-ink group-hover:text-app-accent block">
                Add a Subheading / Dek
              </span>
              <span className="text-[10px] text-app-muted">32px · Regular</span>
            </div>
            <span className="text-xs text-app-muted group-hover:text-app-ink font-bold">+</span>
          </button>

          {/* Body Paragraph */}
          <button
            type="button"
            onClick={() =>
              handleAddTypography({
                text: "Grounded body paragraph with full factual evidence and narrative depth.",
                fontSize: 24,
                fontWeight: "normal",
                fontFamily: theme.fontBody,
                width: 800,
                height: 180,
              })
            }
            className="w-full text-left p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs text-app-ink/80 group-hover:text-app-accent block">
                Add Body Paragraph
              </span>
              <span className="text-[10px] text-app-muted">24px · Body Sans</span>
            </div>
            <span className="text-xs text-app-muted group-hover:text-app-ink font-bold">+</span>
          </button>

          {/* Big Stat Callout */}
          <button
            type="button"
            onClick={() =>
              handleAddTypography({
                text: "+78% METRIC",
                fontSize: 64,
                fontWeight: "bold",
                fontFamily: theme.fontHeading,
                width: 480,
                height: 100,
              })
            }
            className="w-full text-left p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-mono font-bold text-app-accent block">
                Big Metric / Stat Callout
              </span>
              <span className="text-[10px] text-app-muted">64px · High-Impact</span>
            </div>
            <span className="text-xs text-app-muted group-hover:text-app-ink font-bold">+</span>
          </button>

          {/* Editorial Quote */}
          <button
            type="button"
            onClick={() =>
              handleAddTypography({
                text: '“Clear thinking requires courage rather than cleverness.”',
                fontSize: 28,
                fontStyle: "italic",
                fontFamily: theme.fontHeading,
                width: 760,
                height: 140,
              })
            }
            className="w-full text-left p-3 rounded-lg border border-app-border bg-app-surface hover:border-app-accent hover:bg-app-accent/5 transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-serif italic text-app-ink group-hover:text-app-accent block">
                Pull Quote Callout
              </span>
              <span className="text-[10px] text-app-muted">28px · Italic Serif</span>
            </div>
            <span className="text-xs text-app-muted group-hover:text-app-ink font-bold">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

