/**
 * Thread Format Definition
 * Sequential multi-post narrative series breaking an article into discrete atomic thoughts.
 */

import { z } from "zod";
import { FormatDefinition } from "../types";

export const ThreadSlotSchema = z.object({
  hook_post: z.string().min(40).max(280),
  body_posts: z.array(z.string().min(40).max(280)).min(2).max(8),
  conclusion_post: z.string().min(30).max(280),
  call_to_action_post: z.string().min(20).max(200),
  source_item_ids: z.array(z.string().min(1)).min(1),
});

export type ThreadSlots = z.infer<typeof ThreadSlotSchema>;

export const threadFormat: FormatDefinition = {
  id: "thread",
  name: "Post Thread",
  description: "A connected sequence of short posts walking through key takeaways step-by-step.",
  mediaType: "text-only",
  slotSchema: ThreadSlotSchema,
  promptTemplateGuidance: "Break the core argument down into sequential, numbered posts. Maintain momentum and link each post to a digest point.",
};

