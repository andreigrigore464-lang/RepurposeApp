"use client";

/**
 * Brand Style & Voice Sidebar Tab
 * Allows editing color palette, typography pairing, and tone guidelines directly inside the template designer.
 * System Layer: ui / brand / template-designer
 */

import React from "react";
import { BrandTheme } from "@/render/layout/resolve-slots";

interface BrandStyleTabProps {
  theme: BrandTheme;
  voiceGuidelines: string;
  onThemeChange: (updated: BrandTheme) => void;
  onVoiceChange: (voice: string) => void;
}

export function BrandStyleTab({
  theme,
  voiceGuidelines,
  onThemeChange,
  onVoiceChange,
}: BrandStyleTabProps): React.JSX.Element {
  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-sm space-y-5">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-app-ink">
          Identity, Colors & Voice
        </h3>
        <p className="text-[11px] text-app-muted mt-0.5">
          Modifying colors and typography updates the canvas preview live.
        </p>
      </div>

      {/* Colors Grid */}
      <div className="space-y-3">
        <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
          Color Palette
        </label>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-app-muted block mb-1">Primary Color</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.primaryColor}
                onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={theme.primaryColor}
                onChange={(e) => onThemeChange({ ...theme, primaryColor: e.target.value })}
                className="w-full text-[11px] font-mono uppercase rounded border border-app-border bg-app-subtle/40 px-2 py-1 text-app-ink"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-app-muted block mb-1">Secondary / Accent</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.secondaryColor}
                onChange={(e) => onThemeChange({ ...theme, secondaryColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={theme.secondaryColor}
                onChange={(e) => onThemeChange({ ...theme, secondaryColor: e.target.value })}
                className="w-full text-[11px] font-mono uppercase rounded border border-app-border bg-app-subtle/40 px-2 py-1 text-app-ink"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-app-muted block mb-1">Background Color</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.backgroundColor}
                onChange={(e) => onThemeChange({ ...theme, backgroundColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={theme.backgroundColor}
                onChange={(e) => onThemeChange({ ...theme, backgroundColor: e.target.value })}
                className="w-full text-[11px] font-mono uppercase rounded border border-app-border bg-app-subtle/40 px-2 py-1 text-app-ink"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-app-muted block mb-1">Text Color</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={theme.textColor}
                onChange={(e) => onThemeChange({ ...theme, textColor: e.target.value })}
                className="h-7 w-7 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
              />
              <input
                type="text"
                value={theme.textColor}
                onChange={(e) => onThemeChange({ ...theme, textColor: e.target.value })}
                className="w-full text-[11px] font-mono uppercase rounded border border-app-border bg-app-subtle/40 px-2 py-1 text-app-ink"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="space-y-3 border-t border-app-border pt-3">
        <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
          Typography Pairing
        </label>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-app-muted block mb-1">Heading Font</span>
            <select
              value={theme.fontHeading}
              onChange={(e) => onThemeChange({ ...theme, fontHeading: e.target.value })}
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2 py-1.5 text-app-ink text-xs"
            >
              <option value="Playfair Display">Playfair Display (Serif)</option>
              <option value="Inter">Inter (Clean Sans)</option>
            </select>
          </div>

          <div>
            <span className="text-[10px] text-app-muted block mb-1">Body Font</span>
            <select
              value={theme.fontBody}
              onChange={(e) => onThemeChange({ ...theme, fontBody: e.target.value })}
              className="w-full rounded border border-app-border bg-app-subtle/40 px-2 py-1.5 text-app-ink text-xs"
            >
              <option value="Inter">Inter (Sans)</option>
              <option value="Playfair Display">Playfair Display (Serif)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Editorial Voice Guidelines */}
      <div className="space-y-2 border-t border-app-border pt-3">
        <label className="block text-[11px] font-semibold text-app-muted uppercase tracking-wider">
          Editorial Voice Constraints
        </label>
        <textarea
          rows={3}
          value={voiceGuidelines}
          onChange={(e) => onVoiceChange(e.target.value)}
          placeholder="Tone constraints for LLM format generation..."
          className="w-full rounded-md border border-app-border bg-app-subtle/40 p-2 text-xs text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent leading-relaxed"
        />
      </div>
    </div>
  );
}

