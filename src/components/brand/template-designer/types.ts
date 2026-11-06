/**
 * Template Designer Types
 * Interfaces for template designer state, snapping guidelines, and slot metadata.
 * System Layer: ui / brand / template-designer
 */

import { TemplateElement } from "@/render/template-schema";

export type ArchetypeId =
  | "card"
  | "carousel-cover"
  | "carousel-body"
  | "carousel-closing"
  | "video-reel";

export type AspectRatioType = "square" | "portrait" | "vertical";

export interface ArchetypeConfig {
  id: ArchetypeId;
  label: string;
  format: "card" | "carousel" | "video-reel";
  pageIndex: number;
  description: string;
}

export interface SnapLine {
  orientation: "horizontal" | "vertical";
  position: number;
  start: number;
  end: number;
  type: "center" | "margin" | "element";
}

export interface AvailableSlot {
  slot: string;
  label: string;
  type: "text" | "image" | "shape" | "video" | "captions";
  defaultText?: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFontSize?: number;
  description: string;
}

export interface DesignerDimensions {
  width: number;
  height: number;
  label: string;
}

export const ASPECT_RATIOS: Record<AspectRatioType, DesignerDimensions> = {
  square: { width: 1080, height: 1080, label: "1:1 Square (1080×1080)" },
  portrait: { width: 1080, height: 1350, label: "4:5 Portrait (1080×1350)" },
  vertical: { width: 1080, height: 1920, label: "9:16 Vertical Reel (1080×1920)" },
};
