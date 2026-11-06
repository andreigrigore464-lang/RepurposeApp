/**
 * Carousel Format Generator
 * Synthesizes a structured multi-slide visual presentation strictly from extracted digest items.
 * Pipeline Stage: 3-format
 */

import { CarouselSlotSchema, CarouselSlots } from "../../registries/formats/carousel";
import {
  FormatGenerationContext,
  executeFormatGeneration,
  serializeDigestForPrompt,
} from "./format-generator-base";
import { insertFormatOutput, FormatOutputRecord } from "../../db/queries-format-outputs";

export async function generateCarouselFormat(
  context: FormatGenerationContext
): Promise<FormatOutputRecord> {
  const digestText = serializeDigestForPrompt(context.digestItems);

  const systemInstruction = `You are an editorial presentation designer.
Synthesize a structured 3 to 8 slide carousel presentation from the provided grounded digest items.

RULES:
1. Grounding: Every slide point must directly correspond to claims in the digest items.
2. cover_slide:
   - kicker: 5-35 characters category label (e.g. "HISTORICAL INSIGHT").
   - title: 15-80 characters bold deck title.
   - subtitle: 20-140 characters context hook.
3. body_slides: Array of 3 to 8 sequential slides, each with:
   - slide_number: 1, 2, 3...
   - title: 8-60 characters punchy header.
   - body: 25-220 characters grounded explanation.
   - badge: Optional 2-25 characters tag (e.g. "Context", "Fact 01", "Timeline").
4. closing_slide:
   - title: 8-60 characters takeaway title.
   - summary: 20-160 characters conclusion.
   - call_to_action: 10-100 characters prompt to read article.
5. source_item_ids: Array of string IDs used across all slides.

Output pure JSON matching the schema:
{
  "cover_slide": { "kicker": "...", "title": "...", "subtitle": "..." },
  "body_slides": [
    { "slide_number": 1, "title": "...", "body": "...", "badge": "Step 01" }
  ],
  "closing_slide": { "title": "...", "summary": "...", "call_to_action": "..." },
  "source_item_ids": ["item_1", "..."]
}`;

  const userPrompt = `ARTICLE TITLE: "${context.articleTitle}"
${context.brandVoiceGuidelines ? `BRAND VOICE GUIDELINES: "${context.brandVoiceGuidelines}"\n` : ""}
GROUNDED DIGEST ITEMS:
${digestText}`;

  const result = await executeFormatGeneration<CarouselSlots>(
    "carousel",
    CarouselSlotSchema,
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
    formatKind: "carousel",
    slotsData: slotsToSave,
    referencedItemIds: result.referencedItemIds,
    status: "draft",
  });

  console.log(
    `[format] article=${context.articleId} format=carousel id=${record.id} slides=${(result.slots.body_slides?.length || 0) + 2} retries=${result.retriesUsed} status=success`
  );

  return record;
}

