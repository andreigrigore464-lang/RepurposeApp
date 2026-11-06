/**
 * Carousel Format Definition
 * Multi-slide visual presentation designed for swipeable platforms (LinkedIn PDF, Instagram images).
 */

import { z } from "zod";
import { FormatDefinition } from "../types";

export const CarouselSlideSchema = z.object({
  slide_number: z.number().int().positive(),
  title: z.string().min(4).max(100),
  body: z.string().min(15).max(300),
  badge: z.string().min(1).max(40).optional(),
});

export const CarouselSlotSchema = z.object({
  cover_slide: z.object({
    kicker: z.string().min(2).max(50),
    title: z.string().min(8).max(120),
    subtitle: z.string().min(10).max(220),
  }),
  body_slides: z.array(CarouselSlideSchema).min(2).max(8),
  closing_slide: z.object({
    title: z.string().min(4).max(90),
    summary: z.string().min(10).max(260),
    call_to_action: z.string().min(5).max(140),
  }),
  source_item_ids: z.array(z.string().min(1)).min(1),
});

export type CarouselSlots = z.infer<typeof CarouselSlotSchema>;

export const carouselFormat: FormatDefinition = {
  id: "carousel",
  name: "Visual Carousel",
  description: "A multi-page structured visual deck with a cover slide, body takeaways, and closing CTA.",
  mediaType: "multi-image-or-pdf",
  slotSchema: CarouselSlotSchema,
  promptTemplateGuidance: "Structure 3-8 key claims into distinct sequential slides with clear visual headers and body summaries.",
};

