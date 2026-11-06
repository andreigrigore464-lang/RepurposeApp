"use client";

/**
 * Content Slot Palette Sidebar
 * Displays available grounded slots for the active archetype, enabling easy addition or selection.
 * System Layer: ui / brand / template-designer
 */

import React from "react";
import { TemplateElement } from "@/render/template-schema";
import { ArchetypeId, AvailableSlot } from "./types";

interface SlotPaletteProps {
  archetypeId: ArchetypeId;
  elements: TemplateElement[];
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onAddSlot: (slot: AvailableSlot) => void;
}

export const ARCHETYPE_AVAILABLE_SLOTS: Record<ArchetypeId, AvailableSlot[]> = {
  card: [
    {
      slot: "kicker",
      label: "Kicker / Category",
      type: "text",
      defaultText: "KEY TAKEAWAY",
      defaultWidth: 260,
      defaultHeight: 32,
      defaultFontSize: 18,
      description: "Small uppercase category tag or kicker",
    },
    {
      slot: "headline",
      label: "Headline / Core Claim",
      type: "text",
      defaultText: "Core insight extracted from article",
      defaultWidth: 920,
      defaultHeight: 320,
      defaultFontSize: 52,
      description: "Primary large headline text",
    },
    {
      slot: "stat_callout",
      label: "Data / Stat Callout",
      type: "text",
      defaultText: "+42% Grounded Insight",
      defaultWidth: 400,
      defaultHeight: 80,
      defaultFontSize: 36,
      description: "Key metric or data highlight",
    },
    {
      slot: "article_image",
      label: "Article Image",
      type: "image",
      defaultWidth: 400,
      defaultHeight: 300,
      description: "Original in-article photograph",
    },
    {
      slot: "brand.logo",
      label: "Brand Logo",
      type: "image",
      defaultWidth: 160,
      defaultHeight: 48,
      description: "Publication identity logo",
    },
    {
      slot: "accent_shape",
      label: "Accent Pill / Bar",
      type: "shape",
      defaultWidth: 280,
      defaultHeight: 44,
      description: "Visual container or highlight shape",
    },
  ],
  "carousel-cover": [
    {
      slot: "cover_slide.kicker",
      label: "Cover Kicker",
      type: "text",
      defaultText: "EDITORIAL DECK",
      defaultWidth: 900,
      defaultHeight: 40,
      defaultFontSize: 22,
      description: "Top category or topic label",
    },
    {
      slot: "cover_slide.title",
      label: "Deck Title",
      type: "text",
      defaultText: "Main Story Headline",
      defaultWidth: 900,
      defaultHeight: 400,
      defaultFontSize: 64,
      description: "Bold title for the carousel cover slide",
    },
    {
      slot: "cover_slide.subtitle",
      label: "Cover Subtitle",
      type: "text",
      defaultText: "A grounded walkthrough in 5 essential takeaways.",
      defaultWidth: 900,
      defaultHeight: 200,
      defaultFontSize: 32,
      description: "Secondary context or summary",
    },
    {
      slot: "article_image",
      label: "Article Cover Image",
      type: "image",
      defaultWidth: 900,
      defaultHeight: 350,
      description: "Featured visual from the article",
    },
    {
      slot: "brand.logo",
      label: "Brand Logo",
      type: "image",
      defaultWidth: 160,
      defaultHeight: 48,
      description: "Publisher logo placement",
    },
  ],
  "carousel-body": [
    {
      slot: "body_slide.badge",
      label: "Takeaway Badge",
      type: "text",
      defaultText: "INSIGHT 01",
      defaultWidth: 200,
      defaultHeight: 36,
      defaultFontSize: 16,
      description: "Numbered pill or topic indicator",
    },
    {
      slot: "body_slide.title",
      label: "Takeaway Title",
      type: "text",
      defaultText: "Key Factual Finding",
      defaultWidth: 900,
      defaultHeight: 200,
      defaultFontSize: 48,
      description: "Slide subheader claim",
    },
    {
      slot: "body_slide.body",
      label: "Body Explanation",
      type: "text",
      defaultText: "Verbatim extracted evidence explaining the claim with full grounding.",
      defaultWidth: 900,
      defaultHeight: 400,
      defaultFontSize: 28,
      description: "Paragraph or bullet explanation",
    },
    {
      slot: "page_indicator",
      label: "Page Counter",
      type: "text",
      defaultText: "02 / 07",
      defaultWidth: 120,
      defaultHeight: 30,
      defaultFontSize: 16,
      description: "Current slide / total slides",
    },
    {
      slot: "article_image",
      label: "Supporting Image",
      type: "image",
      defaultWidth: 900,
      defaultHeight: 320,
      description: "In-article image for this takeaway",
    },
  ],
  "carousel-closing": [
    {
      slot: "closing_slide.title",
      label: "Closing Title",
      type: "text",
      defaultText: "The Bottom Line",
      defaultWidth: 900,
      defaultHeight: 180,
      defaultFontSize: 52,
      description: "Final summary header",
    },
    {
      slot: "closing_slide.summary",
      label: "Synthesis Summary",
      type: "text",
      defaultText: "Executive summary uniting all insights into a definitive conclusion.",
      defaultWidth: 900,
      defaultHeight: 320,
      defaultFontSize: 30,
      description: "Concluding takeaways text",
    },
    {
      slot: "closing_slide.call_to_action",
      label: "Call to Action",
      type: "text",
      defaultText: "Read the full investigation at chronicle.example.com",
      defaultWidth: 900,
      defaultHeight: 100,
      defaultFontSize: 24,
      description: "Link or follow prompt",
    },
    {
      slot: "brand.logo",
      label: "Brand Logo",
      type: "image",
      defaultWidth: 200,
      defaultHeight: 60,
      description: "Final branding stamp",
    },
  ],
  "video-reel": [
    {
      slot: "source_video",
      label: "Main Video Feed",
      type: "video",
      defaultWidth: 1080,
      defaultHeight: 608,
      description: "Center video track with AI speaker auto-focus",
    },
    {
      slot: "bg_video_blur",
      label: "Blurred Background",
      type: "video",
      defaultWidth: 1080,
      defaultHeight: 1920,
      description: "Full-bleed blurred ambient video background",
    },
    {
      slot: "captions",
      label: "Karaoke Captions",
      type: "captions",
      defaultWidth: 960,
      defaultHeight: 280,
      defaultFontSize: 84,
      description: "Dynamic active-word karaoke subtitles",
    },
    {
      slot: "clip.hook_title",
      label: "Hook Headline Banner",
      type: "text",
      defaultText: "THE BIGGEST MISTAKE CREATORS MAKE",
      defaultWidth: 900,
      defaultHeight: 120,
      defaultFontSize: 48,
      description: "Top hook title banner text",
    },
    {
      slot: "accent_shape",
      label: "Accent Container",
      type: "shape",
      defaultWidth: 960,
      defaultHeight: 160,
      description: "Dark translucent pill or backdrop banner",
    },
    {
      slot: "brand.logo",
      label: "Brand Logo",
      type: "image",
      defaultWidth: 160,
      defaultHeight: 60,
      description: "Channel or podcast logo watermark",
    },
  ],
};

export function SlotPalette({
  archetypeId,
  elements,
  selectedId,
  onSelectElement,
  onAddSlot,
}: SlotPaletteProps): React.JSX.Element {
  const availableSlots = ARCHETYPE_AVAILABLE_SLOTS[archetypeId] || [];

  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-sm space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-app-ink">Content Slots</h3>
        <p className="text-[11px] text-app-muted mt-0.5">
          Grounded article slots available for this layout archetype.
        </p>
      </div>

      <div className="space-y-2">
        {availableSlots.map((slotDef) => {
          // Check if already present on canvas
          const activeElement = elements.find(
            (el) => (el as any).slot === slotDef.slot || el.id === slotDef.slot
          );
          const isSelected = activeElement && activeElement.id === selectedId;

          return (
            <div
              key={slotDef.slot}
              className={`flex items-center justify-between p-2.5 rounded-md border text-xs transition-colors ${
                isSelected
                  ? "border-app-accent bg-app-accent/5 ring-1 ring-app-accent"
                  : activeElement
                  ? "border-app-border bg-app-subtle/30"
                  : "border-dashed border-app-border bg-transparent opacity-80 hover:opacity-100"
              }`}
            >
              <div
                className="flex-1 cursor-pointer"
                onClick={() => {
                  if (activeElement) onSelectElement(activeElement.id);
                  else onAddSlot(slotDef);
                }}
              >
                <div className="flex items-center gap-1.5 font-medium text-app-ink">
                  <span>{slotDef.label}</span>
                  {activeElement ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  ) : null}
                </div>
                <div className="text-[10px] text-app-muted font-mono">{slotDef.slot}</div>
              </div>

              <div>
                {activeElement ? (
                  <button
                    onClick={() => onSelectElement(activeElement.id)}
                    className="text-[10px] text-app-muted hover:text-app-ink px-2 py-1 rounded hover:bg-app-subtle"
                  >
                    Select
                  </button>
                ) : (
                  <button
                    onClick={() => onAddSlot(slotDef)}
                    className="text-[10px] font-medium text-app-accent hover:text-blue-700 bg-app-accent/10 hover:bg-app-accent/20 px-2 py-1 rounded transition-colors"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

