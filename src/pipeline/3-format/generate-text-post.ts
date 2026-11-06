/**
 * Text Post Format Generator
 * Synthesizes a standalone editorial social post strictly from extracted digest items.
 * Pipeline Stage: 3-format
 */

import { TextPostSlotSchema, TextPostSlots } from "../../registries/formats/text-post";
import {
  FormatGenerationContext,
  executeFormatGeneration,
  serializeDigestForPrompt,
} from "./format-generator-base";
import { insertFormatOutput, FormatOutputRecord } from "../../db/queries-format-outputs";

export async function generateTextPostFormat(
  context: FormatGenerationContext
): Promise<FormatOutputRecord> {
  const digestText = serializeDigestForPrompt(context.digestItems);

  const systemInstruction = `You are a specialist editorial copywriter.
Synthesize a compelling standalone social text post from the provided grounded digest items.

RULES:
1. Grounding: You may ONLY use facts, metrics, and insights present in the digest items. Do NOT invent new facts.
2. Hook: Must be 40-250 characters, scroll-stopping, and punchy.
3. Body paragraphs: 1 to 4 paragraphs, each between 50 and 450 characters.
4. Takeaway: 30-300 characters summarizing the distilled conclusion.
5. Call to action: 15-160 characters prompting reflection or reading the full piece.
6. source_item_ids: Array of string IDs (e.g. ["item_1", "item_3"]) corresponding to the digest items used.

Output pure JSON matching the schema:
{
  "hook": "...",
  "body_paragraphs": ["...", "..."],
  "takeaway": "...",
  "call_to_action": "...",
  "source_item_ids": ["item_1", "..."]
}`;

  const userPrompt = `ARTICLE TITLE: "${context.articleTitle}"
${context.brandVoiceGuidelines ? `BRAND VOICE GUIDELINES: "${context.brandVoiceGuidelines}"\n` : ""}
GROUNDED DIGEST ITEMS:
${digestText}`;

  const result = await executeFormatGeneration<TextPostSlots>(
    "text-post",
    TextPostSlotSchema,
    systemInstruction,
    userPrompt,
    context
  );

  const record = await insertFormatOutput({
    articleId: context.articleId,
    digestId: context.digestId,
    brandId: context.brandId,
    formatKind: "text-post",
    slotsData: result.slots as unknown as Record<string, unknown>,
    referencedItemIds: result.referencedItemIds,
    status: "draft",
  });

  console.log(
    `[format] article=${context.articleId} format=text-post id=${record.id} retries=${result.retriesUsed} status=success`
  );

  return record;
}

