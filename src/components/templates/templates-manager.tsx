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
}

export function TemplatesManager({
  initialTemplates,
  brandKit,
  defaultCardTemplate,
  defaultCarouselTemplate,
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
  const handleStartCreate = (format: "card" | "carousel" = "card") => {
    const baseTemplate = format === "card" ? defaultCardTemplate : defaultCarouselTemplate;
    const newRecord: UserTemplateRecord = {
      id: `tpl-${Date.now()}`,
      name: format === "card" ? "Editorial Graphic Card" : "Editorial Carousel Deck",
      format,
      isActive: false,
      aspectRatio: format === "card" ? "square" : "portrait",
      updatedAt: new Date().toISOString(),
      template: {
        ...baseTemplate,
        id: `tpl-${Date.now()}`,
        name: format === "card" ? "Editorial Graphic Card" : "Editorial Carousel Deck",
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

  // IF NO TEMPLATES EXIST: EMPTY STATE WITH ONLY ONE BUTTON
  if (templates.length === 0) {
    return (
      <div className="bg-app-surface border border-dashed border-app-border rounded-xl p-16 text-center shadow-xs max-w-xl mx-auto my-8">
        <div className="h-12 w-12 rounded-full bg-app-subtle flex items-center justify-center mx-auto mb-4 text-app-ink">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>

        <h2 className="text-lg font-serif font-bold text-app-ink mb-1">
          No Templates Configured
        </h2>
        <p className="text-xs text-app-muted max-w-sm mx-auto mb-6">
          Set up master layouts for your social graphic cards and swipeable carousels.
        </p>

        <button
          onClick={() => handleStartCreate("card")}
          className="rounded-md bg-app-ink px-5 py-2.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-sm inline-flex items-center gap-2"
        >
          <span>Create your first template</span>
          <span>→</span>
        </button>
      </div>
    );
  }

  // POPULATED STATE: TEMPLATES LIST / GRID
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-app-ink tracking-tight">
            Templates
          </h1>
          <p className="text-sm text-app-muted mt-1">
            Design and customize visual templates for your social cards and carousels. Assign templates to your publishing pipelines in the Workflow tab.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStartCreate("card")}
            className="rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            + New Card
          </button>
          <button
            onClick={() => handleStartCreate("carousel")}
            className="rounded-md bg-app-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs"
          >
            + New Carousel
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => {
          const bg =
            tpl.template?.pages?.[0]?.background?.color || brandTheme.backgroundColor;
          const isDark = bg === "#18181b" || bg === "#000000";

          return (
            <div
              key={tpl.id}
              className="border border-app-border rounded-xl p-5 bg-app-surface shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-zinc-300"
            >
              <div>
                {/* Mini Visual Swatch */}
                <div
                  className="h-36 rounded-lg p-3 flex flex-col justify-between mb-4 border border-black/10 relative overflow-hidden"
                  style={{ backgroundColor: bg }}
                >
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

                  <div className="flex items-center justify-between text-[9px] font-mono opacity-60">
                    <span className={isDark ? "text-white" : "text-zinc-600"}>
                      {tpl.format.toUpperCase()}
                    </span>
                    <span className={isDark ? "text-white" : "text-zinc-600"}>
                      {tpl.aspectRatio === "square" ? "1080 × 1080" : "1080 × 1350"}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border border-app-border bg-app-subtle text-app-muted font-medium">
                    {tpl.format}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-serif font-bold text-base text-app-ink truncate mb-1">
                  {tpl.name}
                </h3>
                <p className="text-[11px] text-app-muted font-mono mb-4">
                  Updated {new Date(tpl.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(tpl.id)}
                  title="Delete template"
                  className="p-2 rounded-md border border-app-border text-app-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

