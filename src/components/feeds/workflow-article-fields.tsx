"use client";

/**
 * Workflow Article Configuration Fields
 * Settings for written article workflows: graphic card templates, carousel templates, and output formats.
 * System Layer: ui / feeds
 */

import React from "react";
import { UserTemplateRecord } from "@/db/queries-brand-kit";

interface WorkflowArticleFieldsProps {
  cardTemplates: UserTemplateRecord[];
  carouselTemplates: UserTemplateRecord[];
  cardTemplateId?: string;
  onSelectCardTemplateId: (id?: string) => void;
  carouselTemplateId?: string;
  onSelectCarouselTemplateId: (id?: string) => void;
  enabledFormats: string[];
  onToggleFormat: (formatId: string) => void;
}

const AVAILABLE_FORMATS = [
  { id: "text-post", label: "Text Post", description: "Single thought post" },
  { id: "thread", label: "Thread", description: "Multi-part breakdown" },
  { id: "card", label: "Graphic Card", description: "Visual quote or stat slide" },
  { id: "carousel", label: "Carousel Deck", description: "Multi-slide PDF deck" },
];

export function WorkflowArticleFields({
  cardTemplates,
  carouselTemplates,
  cardTemplateId,
  onSelectCardTemplateId,
  carouselTemplateId,
  onSelectCarouselTemplateId,
  enabledFormats,
  onToggleFormat,
}: WorkflowArticleFieldsProps): React.JSX.Element {
  return (
    <>
      {/* Article Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-app-border/60">
        <div>
          <label className="text-xs font-semibold text-app-ink block mb-1">
            Graphic Card Template
          </label>
          <select
            value={cardTemplateId || "default"}
            onChange={(e) =>
              onSelectCardTemplateId(
                e.target.value === "default" ? undefined : e.target.value
              )
            }
            className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
          >
            <option value="default">Default Editorial Card</option>
            {cardTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-app-ink block mb-1">
            Carousel Deck Template
          </label>
          <select
            value={carouselTemplateId || "default"}
            onChange={(e) =>
              onSelectCarouselTemplateId(
                e.target.value === "default" ? undefined : e.target.value
              )
            }
            className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
          >
            <option value="default">Default Editorial Deck</option>
            {carouselTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formats Checklist */}
      <div className="pt-2 border-t border-app-border/60">
        <label className="text-xs font-semibold text-app-ink block mb-2 font-mono uppercase tracking-wider text-app-muted">
          Enabled Output Formats
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {AVAILABLE_FORMATS.map((fmt) => {
            const active = enabledFormats.includes(fmt.id);
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onToggleFormat(fmt.id)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  active
                    ? "border-app-ink bg-app-subtle/80 font-medium"
                    : "border-app-border bg-app-surface opacity-60 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-app-ink">{fmt.label}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      active ? "bg-emerald-500" : "bg-zinc-300"
                    }`}
                  />
                </div>
                <span className="text-[11px] text-app-muted">{fmt.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

