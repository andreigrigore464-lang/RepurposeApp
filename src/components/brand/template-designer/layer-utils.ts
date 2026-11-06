/**
 * Layer Utilities & Human-Friendly Naming
 * Translates raw slot IDs into human editorial labels and provides realistic sample text.
 * System Layer: ui / brand / template-designer
 */

import { TemplateElement, TextElement } from "@/render/template-schema";

export interface FriendlyLabel {
  title: string;
  category: string;
  icon: "text" | "image" | "shape";
}

const SLOT_LABEL_MAP: Record<string, { title: string; category: string }> = {
  // Card Slots
  kicker: { title: "Category Kicker", category: "Kicker / Topic Tag" },
  headline: { title: "Article Headline", category: "Main Title Claim" },
  stat_callout: { title: "Data / Stat Callout", category: "Highlighted Metric" },

  // Carousel Cover Slots
  "cover_slide.kicker": { title: "Cover Kicker", category: "Topic Header" },
  "cover_slide.title": { title: "Deck Title", category: "Cover Headline" },
  "cover_slide.subtitle": { title: "Deck Subtitle", category: "Context Summary" },

  // Carousel Body Slots
  "body_slide.badge": { title: "Takeaway Badge", category: "Section Number" },
  "body_slide.title": { title: "Takeaway Subtitle", category: "Core Finding" },
  "body_slide.body": { title: "Body Explanation", category: "Factual Evidence" },
  page_indicator: { title: "Page Indicator", category: "Slide Counter" },

  // Carousel Closing Slots
  "closing_slide.title": { title: "Closing Header", category: "Takeaway Header" },
  "closing_slide.summary": { title: "Synthesis Summary", category: "Bottom Line" },
  "closing_slide.call_to_action": { title: "Call to Action", category: "Outro Prompt" },

  // Common Media Slots
  article_image: { title: "Article Image", category: "In-Article Photo" },
  "brand.logo": { title: "Brand Logo", category: "Publication Logo" },
};

const SAMPLE_TEXT_MAP: Record<string, string> = {
  kicker: "KEY INSIGHT",
  headline: "Knocker Uppers and Candle Clocks: How People Woke Up Before Alarms",
  stat_callout: "+42% Productivity Finding",
  "cover_slide.kicker": "EDITORIAL DECK",
  "cover_slide.title": "Knocker Uppers & Candle Clocks",
  "cover_slide.subtitle": "A grounded exploration of human alarm clocks in industrial Britain.",
  "body_slide.badge": "INSIGHT 01",
  "body_slide.title": "The Rise of Human Alarms",
  "body_slide.body":
    "Before mechanical clocks became cheap, workers hired knocker-uppers with long bamboo poles to tap bedroom windows.",
  page_indicator: "02 / 07",
  "closing_slide.title": "The Bottom Line",
  "closing_slide.summary":
    "Synchronous waking defined industrial society, transforming personal sleep into collective coordination.",
  "closing_slide.call_to_action": "Read the full investigation at chronicle.example.com",
};

export function getFriendlyLabel(element: TemplateElement): FriendlyLabel {
  const slot = (element as any).slot;

  if (slot && SLOT_LABEL_MAP[slot]) {
    return {
      title: SLOT_LABEL_MAP[slot].title,
      category: SLOT_LABEL_MAP[slot].category,
      icon: element.type,
    };
  }

  if (element.type === "shape") {
    return {
      title: "Accent Container",
      category: "Visual Shape",
      icon: "shape",
    };
  }

  if (element.type === "image") {
    return {
      title: "Image Placeholder",
      category: "Visual Asset",
      icon: "image",
    };
  }

  // Fallback for custom text
  const cleanId = element.id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: cleanId || "Custom Text",
    category: "Text Block",
    icon: "text",
  };
}

export function getSampleText(textEl: TextElement): string {
  if (textEl.default_text && textEl.default_text.trim().length > 0) {
    return textEl.default_text;
  }

  if (textEl.slot && SAMPLE_TEXT_MAP[textEl.slot]) {
    return SAMPLE_TEXT_MAP[textEl.slot];
  }

  return "Sample Editorial Text";
}

