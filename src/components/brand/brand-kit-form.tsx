"use client";

/**
 * Brand Kit Configuration Form
 * Interactive form for setting colors, typography, and editorial voice guidelines.
 * System Layer: ui / brand
 */

import React, { useState } from "react";
import { BrandKitRecord } from "@/db/queries-brand-kit";

interface BrandKitFormProps {
  initialBrandKit: BrandKitRecord | null;
}

export function BrandKitForm({ initialBrandKit }: BrandKitFormProps): React.JSX.Element {
  const [primaryColor, setPrimaryColor] = useState(initialBrandKit?.primary_color || "#18181b");
  const [secondaryColor, setSecondaryColor] = useState(initialBrandKit?.secondary_color || "#2563eb");
  const [backgroundColor, setBackgroundColor] = useState(initialBrandKit?.background_color || "#ffffff");
  const [textColor, setTextColor] = useState(initialBrandKit?.text_color || "#09090b");
  const [fontHeading, setFontHeading] = useState(initialBrandKit?.font_heading || "Playfair Display");
  const [fontBody, setFontBody] = useState(initialBrandKit?.font_body || "Inter");
  const [voiceGuidelines, setVoiceGuidelines] = useState(
    initialBrandKit?.voice_guidelines ||
      "Direct, analytical, calm tone. Avoid hyperbolic marketing buzzwords (unleash, revolutionary, game-changer). Focus on concrete numbers and exact quotes."
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg("");

    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          background_color: backgroundColor,
          text_color: textColor,
          font_heading: fontHeading,
          font_body: fontBody,
          voice_guidelines: voiceGuidelines,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update brand kit.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Form Controls */}
      <div className="lg:col-span-7 space-y-8">
        {/* Color Palette Section */}
        <section className="bg-app-surface border border-app-border rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-app-ink mb-1">Color Palette</h2>
          <p className="text-xs text-app-muted mb-6">
            Applied across social cards, carousel slides, and highlight badges.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-app-ink mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full text-xs font-mono uppercase rounded-md border border-app-border bg-app-subtle/40 px-3 py-2 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-app-ink mb-1.5">
                Secondary / Accent
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-full text-xs font-mono uppercase rounded-md border border-app-border bg-app-subtle/40 px-3 py-2 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-app-ink mb-1.5">
                Slide Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full text-xs font-mono uppercase rounded-md border border-app-border bg-app-subtle/40 px-3 py-2 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-app-ink mb-1.5">
                Primary Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-9 w-9 rounded cursor-pointer border border-app-border bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full text-xs font-mono uppercase rounded-md border border-app-border bg-app-subtle/40 px-3 py-2 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="bg-app-surface border border-app-border rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-app-ink mb-1">Typography Pairing</h2>
          <p className="text-xs text-app-muted mb-6">
            Curated open-source SIL typefaces rendered across server canvas and browser exports.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-app-ink mb-1.5">
                Editorial Heading Font
              </label>
              <select
                value={fontHeading}
                onChange={(e) => setFontHeading(e.target.value)}
                className="w-full text-xs rounded-md border border-app-border bg-app-subtle/40 px-3 py-2 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
              >
                <option value="Playfair Display">Playfair Display (Editorial Serif)</option>
                <option value="Inter">Inter (Modern Clean Sans)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-app-ink mb-1.5">
                Body & Interface Font
              </label>
              <select
                value={fontBody}
                onChange={(e) => setFontBody(e.target.value)}
                className="w-full text-xs rounded-md border border-app-border bg-app-subtle/40 px-3 py-2 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
              >
                <option value="Inter">Inter (Standard Editorial Sans)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Editorial Voice Guidelines */}
        <section className="bg-app-surface border border-app-border rounded-lg p-6 shadow-sm">
          <h2 className="text-base font-semibold text-app-ink mb-1">Editorial Voice Guidelines</h2>
          <p className="text-xs text-app-muted mb-4">
            Guides format generation prompt constraints. The LLM adheres to these tone rules when summarizing digest items.
          </p>

          <textarea
            rows={4}
            value={voiceGuidelines}
            onChange={(e) => setVoiceGuidelines(e.target.value)}
            className="w-full text-xs leading-relaxed rounded-md border border-app-border bg-app-subtle/40 p-3 text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
            placeholder="Specify voice rules, forbidden words, and tone constraints..."
          />
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {saveSuccess && (
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Brand Kit updated successfully.
              </span>
            )}
            {errorMsg && <span className="text-xs text-red-600">{errorMsg}</span>}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-app-accent px-5 py-2 text-xs font-medium text-white shadow hover:bg-app-accent-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Brand Kit"}
          </button>
        </div>
      </div>

      {/* Right Column: Live Styled Preview Card */}
      <div className="lg:col-span-5">
        <div className="sticky top-20 bg-app-surface border border-app-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wider">
              Live Theme Preview
            </h3>
            <span className="text-[10px] text-app-faint font-mono">1080 × 1080 Card Preview</span>
          </div>

          <div
            className="w-full aspect-square rounded-lg p-8 flex flex-col justify-between border border-app-border/80 shadow-inner"
            style={{ backgroundColor: backgroundColor }}
          >
            <div>
              <div
                className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                style={{
                  color: secondaryColor,
                  backgroundColor: `${secondaryColor}15`,
                }}
              >
                Editorial Preview
              </div>

              <h4
                className="text-2xl font-bold mt-6 leading-tight"
                style={{
                  color: textColor,
                  fontFamily: fontHeading === "Playfair Display" ? "Playfair Display, serif" : "Inter, sans-serif",
                }}
              >
                Grounding Fact Verification Engine
              </h4>

              <div
                className="text-4xl font-black mt-6"
                style={{ color: secondaryColor }}
              >
                100%
              </div>

              <p
                className="text-xs leading-relaxed mt-4"
                style={{
                  color: textColor,
                  opacity: 0.7,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Every social post is cross-referenced directly against exact sentences in the source article.
              </p>
            </div>

            <div
              className="pt-4 border-t flex justify-between items-center text-[10px] font-medium"
              style={{
                borderColor: `${textColor}20`,
                color: textColor,
                opacity: 0.5,
              }}
            >
              <span>Editorial Brand</span>
              <span>Editorial Strategy</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

