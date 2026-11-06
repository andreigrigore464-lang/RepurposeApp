/**
 * Template JSON Zod Schema & Types
 * Defines declarative visual templates containing pages and positioned elements with slot bindings.
 * Supports static card, multi-slide carousel, and 9:16 short video reel formats.
 * System Layer: render
 */

import { z } from "zod";

const BaseElementSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const TextElementSchema = BaseElementSchema.extend({
  type: z.literal("text"),
  slot: z.string().optional(),
  default_text: z.string().optional(),
  font_family: z.string().optional(),
  font_size: z.number().positive(),
  font_weight: z.enum(["normal", "bold", "600", "700", "800"]).optional(),
  line_height: z.number().positive().optional(),
  letter_spacing: z.number().optional(),
  text_align: z.enum(["left", "center", "right"]).optional(),
  color: z.string().optional(),
  max_lines: z.number().int().positive().optional(),
  auto_shrink_font: z.boolean().optional(),
});
export type TextElement = z.infer<typeof TextElementSchema>;

export const ImageElementSchema = BaseElementSchema.extend({
  type: z.literal("image"),
  slot: z.string().optional(),
  default_url: z.string().optional(),
  border_radius: z.number().min(0).optional(),
  fit: z.enum(["cover", "contain"]).optional(),
});
export type ImageElement = z.infer<typeof ImageElementSchema>;

export const ShapeElementSchema = BaseElementSchema.extend({
  type: z.literal("shape"),
  shape_type: z.enum(["rect", "circle", "line"]),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  stroke_width: z.number().min(0).optional(),
  border_radius: z.number().min(0).optional(),
});
export type ShapeElement = z.infer<typeof ShapeElementSchema>;

export const VideoElementSchema = BaseElementSchema.extend({
  type: z.literal("video"),
  slot: z.string().optional(), // "source_video"
  framing_mode: z
    .enum(["ai_face_focus", "manual_crop", "cover", "contain", "blurred_stack"])
    .optional(),
  zoom: z.number().min(1).max(3).optional(),
  crop_x: z.number().optional(),
  crop_y: z.number().optional(),
  blur_px: z.number().min(0).max(100).optional(),
  brightness: z.number().min(0.1).max(2).optional(),
  border_radius: z.number().min(0).optional(),
});
export type VideoElement = z.infer<typeof VideoElementSchema>;

export const CaptionsElementSchema = BaseElementSchema.extend({
  type: z.literal("captions"),
  slot: z.string().optional(), // "captions"
  font_family: z.string().optional(),
  font_size: z.number().positive(),
  primary_color: z.string().optional(),
  highlight_color: z.string().optional(),
  outline_color: z.string().optional(),
  outline_width: z.number().min(0).max(20).optional(),
  shadow_depth: z.number().min(0).max(20).optional(),
  words_per_phrase: z.number().int().min(1).max(8).optional(),
  uppercase: z.boolean().optional(),
  text_align: z.enum(["left", "center", "right"]).optional(),
});
export type CaptionsElement = z.infer<typeof CaptionsElementSchema>;

export const TemplateElementSchema = z.discriminatedUnion("type", [
  TextElementSchema,
  ImageElementSchema,
  ShapeElementSchema,
  VideoElementSchema,
  CaptionsElementSchema,
]);
export type TemplateElement = z.infer<typeof TemplateElementSchema>;

export const TemplatePageSchema = z.object({
  page_index: z.number().int().nonnegative(),
  background: z.object({
    color: z.string().optional(),
    image_url: z.string().optional(),
  }),
  elements: z.array(TemplateElementSchema),
});
export type TemplatePage = z.infer<typeof TemplatePageSchema>;

export const TemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  format: z.enum(["card", "carousel", "video-reel"]),
  dimensions: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  pages: z.array(TemplatePageSchema).min(1),
});
export type Template = z.infer<typeof TemplateSchema>;
