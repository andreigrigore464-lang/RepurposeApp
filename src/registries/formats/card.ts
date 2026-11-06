/**
 * Card Format Definition
 * Single visual graphic overlay with bold headline, kicker, and key stat/insight.
 */

import { z } from "zod";
import { FormatDefinition } from "../types";

export const CardSlotSchema = z.object({
  kicker: z.string().min(5).max(40),
  headline: z.string().min(15).max(140),
  subhead: z.string().min(20).max(200).optional(),
  stat_callout: z.string().min(2).max(25).optional(),
  attribution: z.string().min(5).max(60),
  source_item_ids: z.array(z.string().min(1)).min(1),
});

export type CardSlots = z.infer<typeof CardSlotSchema>;

export const cardFormat: FormatDefinition = {
  id: "card",
  name: "Graphic Card",
  description: "A single bold image card featuring a kicker, headline, and optional metric callout.",
  mediaType: "single-image",
  slotSchema: CardSlotSchema,
  promptTemplateGuidance: "Select the most visually compelling metric or headline quote from the digest to display prominently on a single graphic.",
};

