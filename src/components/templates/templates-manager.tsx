"use client";

/**
 * Master Templates Manager
 * Consolidated dashboard for viewing all master templates, setting active generation defaults, and launching the designer.
 * System Layer: ui / templates
 */

import React, { useState } from "react";
import { UserTemplateRecord, BrandKitRecord } from "@/db/queries-brand-kit";
import { Template } from "@/render/template-schema";
import { BrandTheme, DEFAULT_BRAND_THEME } from "@/render/layout/resolve-slots";
import { TemplateDesigner } from "@/components/brand/template-designer/template-designer";

interface TemplatesManagerProps {
  initialTemplates: UserTemplateRecord[];
  brandKit: BrandKitRecord | null;
  defaultCardTemplate: Template;
  defaultCarouselTemplate: Template;
  defaultVideoReelTemplate: Template;
}

export function TemplatesManager({
  initialTemplates,
  brandKit,
  defaultCardTemplate,
  defaultCarouselTemplate,
  defaultVideoReelTemplate,
}: TemplatesManagerProps): React.JSX.Element {
  const [templates, setTemplates] = useState<UserTemplateRecord[]>(initialTemplates);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplateRecord | null>(null);

  const [brandTheme, setBrandTheme] = useState<BrandTheme>({
    primaryColor: brandKit?.primary_color || DEFAULT_BRAND_THEME.primaryColor,
    secondaryColor: brandKit?.secondary_color || DEFAULT_BRAND_THEME.secondaryColor,
    backgroundColor: brandKit?.background_color || DEFAULT_BRAND_THEME.backgroundColor,
    textColor: brandKit?.text_color || DEFAULT_BRAND_THEME.textColor,
    fontHeading: brandKit?.font_heading || DEFAULT_BRAND_THEME.fontHeading,
    fontBody: brandKit?.font_body || DEFAULT_BRAND_THEME.fontBody,
  });

  const [voiceGuidelines, setVoiceGuidelines] = useState(
    brandKit?.voice_guidelines || "Direct, analytical, calm editorial tone."
  );

  // Handler for creating a new template
  const handleStartCreate = (format: "card" | "carousel" | "video-reel" = "card") => {
    let baseTemplate: Template;
    let defaultName = "Editorial Graphic Card";
    let defaultRatio: "square" | "portrait" = "square";

    if (format === "carousel") {
      baseTemplate = defaultCarouselTemplate;
      defaultName = "Editorial Carousel Deck";
      defaultRatio = "portrait";
    } else if (format === "video-reel") {
      baseTemplate = defaultVideoReelTemplate;
      defaultName = "Classic Promo Reel";
      defaultRatio = "portrait";
    } else {
      baseTemplate = defaultCardTemplate;
      defaultName = "Editorial Graphic Card";
      defaultRatio = "square";
    }

    const newRecord: UserTemplateRecord = {
      id: `tpl-${Date.now()}`,
      name: defaultName,
      format,
      isActive: false,
      aspectRatio: defaultRatio,
      updatedAt: new Date().toISOString(),
      template: {
        ...baseTemplate,
        id: `tpl-${Date.now()}`,
        name: defaultName,
      },
    };

    setEditingTemplate(newRecord);
  };

  // Handler for saving a template from the designer
  const handleSaveFromDesigner = async (
    updatedRecord: UserTemplateRecord,
    updatedTheme: BrandTheme,
    updatedVoice: string
  ) => {
    setBrandTheme(updatedTheme);
    setVoiceGuidelines(updatedVoice);

    const nextTemplates = [...templates];
    const existingIdx = nextTemplates.findIndex((t) => t.id === updatedRecord.id);
    if (existingIdx >= 0) {
      nextTemplates[existingIdx] = updatedRecord;
    } else {
      nextTemplates.push(updatedRecord);
    }

    // Persist to backend
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templates: nextTemplates,
        brandKitUpdates: {
          primary_color: updatedTheme.primaryColor,
          secondary_color: updatedTheme.secondaryColor,
          background_color: updatedTheme.backgroundColor,
          text_color: updatedTheme.textColor,
          font_heading: updatedTheme.fontHeading,
          font_body: updatedTheme.fontBody,
          voice_guidelines: updatedVoice,
        },
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to save template to server.");
    }

    setTemplates(nextTemplates);
    setEditingTemplate(updatedRecord);
  };

  // Duplicate a template
  const handleDuplicate = async (source: UserTemplateRecord) => {
    const newRecord: UserTemplateRecord = {
      ...source,
      id: `tpl-${Date.now()}`,
      name: `${source.name} (Copy)`,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    const nextTemplates = [...templates, newRecord];
    setTemplates(nextTemplates);

    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templates: nextTemplates }),
    });
  };

  // Delete a template
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    const nextTemplates = templates.filter((t) => t.id !== id);
    setTemplates(nextTemplates);

    await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templates: nextTemplates }),
    });
  };

  // IF DESIGNER IS ACTIVE: RENDER DESIGNER
  if (editingTemplate) {
    return (
      <TemplateDesigner
        templateRecord={editingTemplate}
        initialBrandTheme={brandTheme}
        initialVoiceGuidelines={voiceGuidelines}
        onSave={handleSaveFromDesigner}
        onBack={() => setEditingTemplate(null)}
      />
    );
  }

  const staticTemplates = templates.filter((t) => t.format !== "video-reel");
  const videoTemplates = templates.filter((t) => t.format === "video-reel");

  // Renders a single template card
  const renderTemplateCard = (tpl: UserTemplateRecord) => {
    const isVideo = tpl.format === "video-reel";
    const bg =
      tpl.template?.pages?.[0]?.background?.color ||
      (isVideo ? "#09090b" : brandTheme.backgroundColor);
    const isDark = isVideo || bg === "#18181b" || bg === "#000000";

    return (
      <div
        key={tpl.id}
        className="border border-app-border rounded-xl p-5 bg-app-surface shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-zinc-300"
      >
        <div>
          {/* Mini Visual Swatch */}
          <div
            className="h-40 rounded-lg p-3 flex flex-col justify-between mb-4 border border-black/10 relative overflow-hidden"
            style={{ backgroundColor: bg }}
          >
            {isVideo ? (
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                    9:16 Reel
                  </span>
                  <span className="text-[10px] text-amber-400 font-bold">🎬</span>
                </div>
                <div className="my-auto py-2 px-3 rounded bg-white/5 border border-white/10 text-center">
                  <div className="h-1.5 w-16 mx-auto rounded-full bg-cyan-400 mb-1.5" />
                  <div className="text-[10px] font-bold text-white tracking-wider">
                    HOOK BANNER
                  </div>
                  <div className="text-[11px] font-extrabold text-amber-300 mt-1 uppercase font-mono">
                    ACTIVE KARAOKE
                  </div>
                </div>
                <div className="text-[9px] font-mono text-white/50 text-right">
                  1080 × 1920
                </div>
              </div>
            ) : (
              <div>
                <div
                  className="h-1.5 w-12 rounded-full mb-2"
                  style={{ backgroundColor: brandTheme.secondaryColor }}
                />
                <div
                  className={`h-3 w-3/4 rounded mb-1.5 ${
                    isDark ? "bg-white/80" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`h-2.5 w-1/2 rounded ${
                    isDark ? "bg-zinc-400" : "bg-zinc-400"
                  }`}
                />
              </div>
            )}

            {!isVideo && (
              <div className="flex items-center justify-between text-[9px] font-mono opacity-60">
                <span className={isDark ? "text-white" : "text-zinc-600"}>
                  {tpl.format.toUpperCase()}
                </span>
                <span className={isDark ? "text-white" : "text-zinc-600"}>
                  {tpl.aspectRatio === "square" ? "1080 × 1080" : "1080 × 1350"}
                </span>
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-medium ${
                isVideo
                  ? "border-amber-300/40 bg-amber-50 text-amber-800"
                  : "border-app-border bg-app-subtle text-app-muted"
              }`}
            >
              {tpl.format}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-serif font-bold text-base text-app-ink truncate mb-1">
            {tpl.name}
          </h3>
          <p className="text-[11px] text-app-muted font-mono mb-4">
            Updated{" "}
            {new Date(tpl.updatedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-app-border pt-4">
          <button
            type="button"
            onClick={() => setEditingTemplate(tpl)}
            className="flex-1 rounded-md bg-app-ink py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs text-center"
          >
            Customize Template
          </button>

          <button
            type="button"
            onClick={() => handleDuplicate(tpl)}
            title="Duplicate template"
            className="p-2 rounded-md border border-app-border text-app-muted hover:text-app-ink hover:bg-app-subtle transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleDelete(tpl.id)}
            title="Delete template"
            className="p-2 rounded-md border border-app-border text-app-muted hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-app-ink tracking-tight">
            Master Templates
          </h1>
          <p className="text-sm text-app-muted mt-1">
            Design and customize visual layouts for written articles (cards and carousels) and short-form video reels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleStartCreate("card")}
            className="rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            + New Card
          </button>
          <button
            onClick={() => handleStartCreate("carousel")}
            className="rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            + New Carousel
          </button>
          <button
            onClick={() => handleStartCreate("video-reel")}
            className="rounded-md bg-app-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <span>🎬</span>
            <span>+ New Video Reel</span>
          </button>
        </div>
      </div>

      {/* Section 1: Static Post Templates (Cards & Carousels) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-bold text-app-ink flex items-center gap-2">
            <span>📰 Static Post Templates</span>
            <span className="text-xs font-normal font-sans text-app-muted">
              ({staticTemplates.length} layouts)
            </span>
          </h2>
        </div>

        {staticTemplates.length === 0 ? (
          <div className="border border-dashed border-app-border rounded-xl p-8 text-center text-xs text-app-muted bg-app-subtle/20">
            No graphic card or carousel templates yet. Click <strong>+ New Card</strong> or <strong>+ New Carousel</strong> above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staticTemplates.map((tpl) => renderTemplateCard(tpl))}
          </div>
        )}
      </div>

      {/* Visual Section Divider separating static from clips */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-app-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-app-surface px-4 py-1 text-xs font-mono text-app-muted uppercase tracking-wider rounded-full border border-app-border">
            Short-Form Video Engine
          </span>
        </div>
      </div>

      {/* Section 2: Video Reel Templates (9:16 Vertical) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-serif font-bold text-app-ink flex items-center gap-2">
              <span>🎬 Short Video Reel Templates</span>
              <span className="text-xs font-normal font-sans text-app-muted">
                ({videoTemplates.length} layouts)
              </span>
            </h2>
            <p className="text-xs text-app-muted mt-0.5">
              9:16 vertical canvas layouts with karaoke subtitles, video subject auto-focus, and hook banners.
            </p>
          </div>

          <button
            onClick={() => handleStartCreate("video-reel")}
            className="text-xs font-medium text-app-accent hover:underline flex items-center gap-1"
          >
            <span>+ Add Reel Template</span>
          </button>
        </div>

        {videoTemplates.length === 0 ? (
          <div className="border border-dashed border-amber-300/60 bg-amber-50/30 rounded-xl p-8 text-center text-xs text-amber-900/80">
            <p className="font-semibold mb-1">No Video Reel Templates Saved Yet</p>
            <p className="text-[11px] text-amber-800/70 mb-4 max-w-md mx-auto">
              Configure your default 9:16 layout (karaoke highlight color, font style, and background blur) for automated podcast reels.
            </p>
            <button
              onClick={() => handleStartCreate("video-reel")}
              className="rounded-md bg-app-ink px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span>+ Create Default Reel Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoTemplates.map((tpl) => renderTemplateCard(tpl))}
          </div>
        )}
      </div>
    </div>
  );
}
