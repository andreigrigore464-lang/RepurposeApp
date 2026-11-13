/**
 * Layer Utilities & Human-Friendly Naming
 * Translates raw slot IDs into human editorial labels and provides realistic sample text.
 * System Layer: ui / brand / template-designer
 */

import { TemplateElement, TextElement } from "@/render/template-schema";

export interface FriendlyLabel {
  title: string;
  category: string;
  icon: "text" | "image" | "shape" | "video" | "captions";
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

  // Video Reel Slots
  source_video: { title: "Video Feed", category: "Video Track" },
  "clip.hook_title": { title: "Hook Headline", category: "Video Header" },
  captions: { title: "Karaoke Captions", category: "Subtitles Track" },

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
  "clip.hook_title": "THE BIGGEST MISTAKE CREATORS MAKE",
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

  if (element.type === "video") {
    const isBlur = (element as any).blur_px > 0;
    return {
      title: isBlur ? "Blurred Video Background" : "Main Video Track",
      category: "Video Layer",
      icon: "video",
    };
  }

  if (element.type === "captions") {
    return {
      title: "Karaoke Subtitles",
      category: "Captions Track",
      icon: "captions",
    };
  }

  if (element.type === "shape") {
    const sType = (element as any).shape_type || "rect";
    const nameMap: Record<string, string> = {
      rect: "Rectangle Box",
      circle: "Circle / Oval",
      line: "Divider Line",
      triangle: "Triangle Shape",
      star: "Star Callout",
      hexagon: "Hexagon Badge",
      arrow: "Directional Arrow",
      badge: "Ribbon Badge",
    };
    return {
      title: nameMap[sType] || "Visual Shape",
      category: "Geometric Shape",
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

export function getShapePoints(
  shapeType: string,
  x: number,
  y: number,
  width: number,
  height: number
): number[] {
  if (shapeType === "triangle") {
    return [x + width / 2, y, x + width, y + height, x, y + height];
  }
  if (shapeType === "star") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outerR = Math.min(width, height) / 2;
    const innerR = outerR * 0.45;
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      pts.push(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    return pts;
  }
  if (shapeType === "hexagon") {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    const pts: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      pts.push(cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry);
    }
    return pts;
  }
  if (shapeType === "arrow") {
    const shaftH = height * 0.4;
    const shaftY = y + (height - shaftH) / 2;
    const headW = width * 0.4;
    return [
      x,
      shaftY,
      x + width - headW,
      shaftY,
      x + width - headW,
      y,
      x + width,
      y + height / 2,
      x + width - headW,
      y + height,
      x + width - headW,
      shaftY + shaftH,
      x,
      shaftY + shaftH,
    ];
  }
  if (shapeType === "badge") {
    return [
      x,
      y,
      x + width,
      y,
      x + width,
      y + height,
      x + width / 2,
      y + height * 0.82,
      x,
      y + height,
    ];
  }
  return [x, y, x + width, y + height];
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
