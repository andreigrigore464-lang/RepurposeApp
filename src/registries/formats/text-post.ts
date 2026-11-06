/**
 * Text Post Format Definition
 * Standard standalone editorial post suitable for microblogging and social networks.
 */

import { z } from "zod";
import { FormatDefinition } from "../types";

export const TextPostSlotSchema = z.object({
  hook: z.string().min(30).max(280),
  body_paragraphs: z.array(z.string().min(40).max(500)).min(1).max(5),
  takeaway: z.string().min(20).max(350),
  call_to_action: z.string().min(10).max(180),
  source_item_ids: z.array(z.string().min(1)).min(1),
});

export type TextPostSlots = z.infer<typeof TextPostSlotSchema>;

export const textPostFormat: FormatDefinition = {
  id: "text-post",
  name: "Text Post",
  description: "A single standalone post with a scroll-stopping hook, body paragraphs, and clear takeaway.",
  mediaType: "text-only",
  slotSchema: TextPostSlotSchema,
  promptTemplateGuidance: "Synthesize a punchy, editorial single post using extracted digest items. Ground every paragraph in source claims.",
};

