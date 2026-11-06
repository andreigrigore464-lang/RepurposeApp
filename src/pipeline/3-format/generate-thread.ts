/**
 * Thread Format Generator
 * Synthesizes a sequential multi-post thread strictly from extracted digest items.
 * Pipeline Stage: 3-format
 */

import { ThreadSlotSchema, ThreadSlots } from "../../registries/formats/thread";
import {
  FormatGenerationContext,
  executeFormatGeneration,
  serializeDigestForPrompt,
} from "./format-generator-base";
import { insertFormatOutput, FormatOutputRecord } from "../../db/queries-format-outputs";

export async function generateThreadFormat(
  context: FormatGenerationContext
): Promise<FormatOutputRecord> {
  const digestText = serializeDigestForPrompt(context.digestItems);

  const systemInstruction = `You are a specialist editorial writer for sequential social threads.
Synthesize an engaging, high-retention multi-post thread from the provided grounded digest items.

RULES:
1. Grounding: You may ONLY use facts, metrics, and quotes present in the digest items.
2. Hook post: 100-250 characters introducing the thesis and compelling the reader to read on.
3. Body posts: 2 to 7 posts, each between 120 and 260 characters, breaking down points sequentially.
4. Conclusion post: 80-220 characters distilling the core realization.
5. Call to action post: 50-180 characters pointing to the full article.
6. source_item_ids: Array of string IDs (e.g. ["item_1", "item_2"]) used across the thread.

Output pure JSON matching the schema:
{
  "hook_post": "...",
  "body_posts": ["...", "..."],
  "conclusion_post": "...",
  "call_to_action_post": "...",
  "source_item_ids": ["item_1", "..."]
}`;

  const userPrompt = `ARTICLE TITLE: "${context.articleTitle}"
${context.brandVoiceGuidelines ? `BRAND VOICE GUIDELINES: "${context.brandVoiceGuidelines}"\n` : ""}
GROUNDED DIGEST ITEMS:
${digestText}`;

  const result = await executeFormatGeneration<ThreadSlots>(
    "thread",
    ThreadSlotSchema,
    systemInstruction,
    userPrompt,
    context
  );

  const record = await insertFormatOutput({
    articleId: context.articleId,
    digestId: context.digestId,
    brandId: context.brandId,
    formatKind: "thread",
    slotsData: result.slots as unknown as Record<string, unknown>,
    referencedItemIds: result.referencedItemIds,
    status: "draft",
  });

  console.log(
    `[format] article=${context.articleId} format=thread id=${record.id} retries=${result.retriesUsed} status=success`
  );

  return record;
}

