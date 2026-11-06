/**
 * Card Format Generator
 * Synthesizes a bold single graphic card layout strictly from extracted digest items.
 * Pipeline Stage: 3-format
 */

import { CardSlotSchema, CardSlots } from "../../registries/formats/card";
import {
  FormatGenerationContext,
  executeFormatGeneration,
  serializeDigestForPrompt,
} from "./format-generator-base";
import { insertFormatOutput, FormatOutputRecord } from "../../db/queries-format-outputs";

export async function generateCardFormat(
  context: FormatGenerationContext
): Promise<FormatOutputRecord> {
  const digestText = serializeDigestForPrompt(context.digestItems);

  const systemInstruction = `You are an editorial art director creating copy for a bold graphic quote/metric card.
Select the most powerful metric, realization, or thesis from the digest items to populate the card slots.

RULES:
1. Grounding: Every text field must be derived strictly from the digest items.
2. kicker: 10-35 characters uppercase category tag (e.g. "INDUSTRY BENCHMARK", "CORE INSIGHT").
3. headline: 25-100 characters bold title or quote.
4. subhead: Optional supporting text between 40 and 160 characters.
5. stat_callout: Optional prominent figure (e.g. "45%", "2.5x", "10,000+").
6. attribution: 10-50 characters source or author attribution.
7. source_item_ids: Array containing the specific digest item ID(s) used.

Output pure JSON matching the schema:
{
  "kicker": "...",
  "headline": "...",
  "subhead": "...",
  "stat_callout": "...",
  "attribution": "...",
  "source_item_ids": ["item_2"]
}`;

  const userPrompt = `ARTICLE TITLE: "${context.articleTitle}"
${context.brandVoiceGuidelines ? `BRAND VOICE GUIDELINES: "${context.brandVoiceGuidelines}"\n` : ""}
GROUNDED DIGEST ITEMS:
${digestText}`;

  const result = await executeFormatGeneration<CardSlots>(
    "card",
    CardSlotSchema,
    systemInstruction,
    userPrompt,
    context
  );

  const slotsToSave: Record<string, unknown> = {
    ...result.slots,
  };
  if (context.articleImages && context.articleImages.length > 0) {
    slotsToSave.article_image = context.articleImages[0];
    slotsToSave.in_article_images = context.articleImages;
  }
  if (context.templateId) {
    slotsToSave.template_id = context.templateId;
  }

  const record = await insertFormatOutput({
    articleId: context.articleId,
    digestId: context.digestId,
    brandId: context.brandId,
    formatKind: "card",
    slotsData: slotsToSave,
    referencedItemIds: result.referencedItemIds,
    status: "draft",
  });

  console.log(
    `[format] article=${context.articleId} format=card id=${record.id} retries=${result.retriesUsed} status=success`
  );

  return record;
}

