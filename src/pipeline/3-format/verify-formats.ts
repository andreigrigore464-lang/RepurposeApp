/**
 * Format Generation Verification & Test Script
 * Exercises slot synthesis for all 4 formats (text-post, thread, card, carousel)
 * using the grounded digest and Gemini Flash, verifying Zod schemas and provenance references.
 */

import { generateAllFormatsForArticle } from "./generate-all-formats";
import { listArticlesForBrand } from "../../db/queries-articles";
import { getDigestByArticleId } from "../../db/queries-digests";
import { listFormatOutputsForArticle } from "../../db/queries-format-outputs";
import { DEFAULT_BRAND_ID } from "../../lib/current-context";
import { TextPostSlotSchema } from "../../registries/formats/text-post";
import { ThreadSlotSchema } from "../../registries/formats/thread";
import { CardSlotSchema } from "../../registries/formats/card";
import { CarouselSlotSchema } from "../../registries/formats/carousel";

async function runFormatsVerification() {
  console.log("==================================================");
  console.log("       PHASE 5: FORMAT GENERATION PIPELINE TEST   ");
  console.log("==================================================");

  // 1. Load article and digest from Supabase
  console.log("\n[1/3] Loading Article and Grounded Digest from Supabase...");
  const articles = await listArticlesForBrand(DEFAULT_BRAND_ID, 1);
  if (articles.length === 0) {
    throw new Error("No articles found in DB. Run Phase 3 verification first.");
  }
  const article = articles[0];

  const digest = await getDigestByArticleId(article.id, "completed");
  if (!digest || digest.items.length === 0) {
    throw new Error(`No completed digest found for article "${article.id}". Run Phase 4 first.`);
  }

  console.log(`✓ Loaded Article: "${article.title}" (${article.id})`);
  console.log(`✓ Loaded Digest: ${digest.items.length} items (${digest.id})`);

  // 2. Generate all 4 formats
  console.log("\n[2/3] Synthesizing All 4 Formats (text-post, thread, card, carousel)...");
  const formatRecords = await generateAllFormatsForArticle({
    articleId: article.id,
    digestId: digest.id,
    brandId: DEFAULT_BRAND_ID,
    articleTitle: article.title,
    digestItems: digest.items,
    inputSource: "rss",
    brandVoiceGuidelines: "Authoritative, concise, analytical.",
  });

  if (formatRecords.length !== 4) {
    throw new Error(`Expected 4 generated formats, got ${formatRecords.length}`);
  }

  console.log(`✓ Successfully generated ${formatRecords.length} format outputs!`);

  // 3. Schema & Provenance Inspection
  console.log("\n[3/3] Validating Zod Schemas and Provenance References...");
  const digestIdSet = new Set(digest.items.map((i) => i.id));

  for (const record of formatRecords) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Format: [${record.format_kind.toUpperCase()}] (ID: ${record.id})`);
    console.log(`Referenced Digest IDs: [${record.referenced_item_ids.join(", ")}]`);

    // Verify all referenced IDs exist
    for (const refId of record.referenced_item_ids) {
      if (!digestIdSet.has(refId)) {
        throw new Error(
          `Format "${record.format_kind}" references invalid digest ID "${refId}"!`
        );
      }
    }

    // Verify schema per format kind
    if (record.format_kind === "text-post") {
      TextPostSlotSchema.parse(record.slots_data);
      const slots = record.slots_data as any;
      console.log(`Hook: "${slots.hook}"`);
      console.log(`Body Paragraphs: ${slots.body_paragraphs.length}`);
      console.log(`Takeaway: "${slots.takeaway}"`);
    } else if (record.format_kind === "thread") {
      ThreadSlotSchema.parse(record.slots_data);
      const slots = record.slots_data as any;
      console.log(`Hook Post: "${slots.hook_post}"`);
      console.log(`Body Posts: ${slots.body_posts.length}`);
      console.log(`Conclusion: "${slots.conclusion_post}"`);
    } else if (record.format_kind === "card") {
      CardSlotSchema.parse(record.slots_data);
      const slots = record.slots_data as any;
      console.log(`Kicker: "${slots.kicker}"`);
      console.log(`Headline: "${slots.headline}"`);
      if (slots.stat_callout) console.log(`Stat Callout: "${slots.stat_callout}"`);
      console.log(`Attribution: "${slots.attribution}"`);
    } else if (record.format_kind === "carousel") {
      CarouselSlotSchema.parse(record.slots_data);
      const slots = record.slots_data as any;
      console.log(`Cover Title: "${slots.cover_slide.title}"`);
      console.log(`Body Slides Count: ${slots.body_slides.length}`);
      console.log(`Closing CTA: "${slots.closing_slide.call_to_action}"`);
    }

    console.log(`✓ Zod Schema Valid & Provenance Intact!`);
  }

  // 4. Confirm in Supabase
  const storedFormats = await listFormatOutputsForArticle(article.id);
  console.log(`\n✓ Stored formats queryable in DB for article: ${storedFormats.length}`);

  console.log("\n==================================================");
  console.log("       ALL FORMAT GENERATION CHECKS PASSED        ");
  console.log("==================================================\n");
}

runFormatsVerification().catch((err) => {
  console.error("Formats verification failed:", err);
  process.exit(1);
});
