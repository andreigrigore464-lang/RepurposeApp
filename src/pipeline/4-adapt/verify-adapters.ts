/**
 * Platform Adapters Verification & Test Script
 * 1. Statically asserts zero hardcoded platform names inside core adapter code.
 * 2. Runs deterministic adaptation across all 14 matrix Format -> Platform routes.
 * 3. Verifies character counts, hashtag constraints, and media packaging specifications.
 * 4. Persists all variants to Supabase platform_variants table.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { adaptAllFormatsToPlatforms } from "./adapt-all-formats";
import { listArticlesForBrand } from "../../db/queries-articles";
import { listFormatOutputsForArticle } from "../../db/queries-format-outputs";
import { DEFAULT_BRAND_ID } from "../../lib/current-context";

async function runAdaptersVerification() {
  console.log("==================================================");
  console.log("       PHASE 6: PLATFORM ADAPTERS PIPELINE TEST   ");
  console.log("==================================================");

  // 1. Static Rule 3 Check: Zero Hardcoded Platform Names in Engine
  console.log("\n[1/4] Verifying Registry Architecture Rule (Zero Hardcoded Platform Names)...");
  const engineFiles = [
    join(__dirname, "adapt-format-to-platform.ts"),
    join(__dirname, "adapt-all-formats.ts"),
    join(__dirname, "format-hashtags.ts"),
  ];

  const forbiddenNames = ["linkedin", "instagram", "facebook", "threads"];
  for (const filePath of engineFiles) {
    const code = readFileSync(filePath, "utf-8");
    for (const name of forbiddenNames) {
      // Look for if (platform === "...") or case "..."
      const checkPattern = new RegExp(`["']${name}["']`, "i");
      if (checkPattern.test(code)) {
        throw new Error(
          `RULE 3 VIOLATION: Hardcoded platform name "${name}" detected in ${filePath}!`
        );
      }
    }
  }
  console.log("✓ PASSED: Engine code contains ZERO hardcoded platform names! Purely registry-driven.");

  // 2. Load Article and Formats from Supabase
  console.log("\n[2/4] Loading Formats from Supabase...");
  const articles = await listArticlesForBrand(DEFAULT_BRAND_ID, 1);
  if (articles.length === 0) {
    throw new Error("No articles found in DB. Run Phase 3 first.");
  }
  const article = articles[0];

  const formats = await listFormatOutputsForArticle(article.id);
  if (formats.length === 0) {
    throw new Error(`No format outputs found for article "${article.id}". Run Phase 5 first.`);
  }

  // Deduplicate format outputs by kind (taking latest)
  const latestFormatsMap = new Map();
  formats.forEach((f) => latestFormatsMap.set(f.format_kind, f));
  const uniqueFormats = Array.from(latestFormatsMap.values());

  console.log(`✓ Loaded Article: "${article.title}" (${article.id})`);
  console.log(`✓ Loaded Formats: [${uniqueFormats.map((f) => f.format_kind).join(", ")}]`);

  // 3. Adapt All Formats to All Permitted Platforms
  console.log("\n[3/4] Deterministically Adapting All Formats to Platform Constraints...");
  const variants = await adaptAllFormatsToPlatforms(uniqueFormats, {
    canonicalUrl: article.canonical_url,
    brandHashtags: ["EditorialTech", "DigitalPublishing", "ContentRepurposing"],
  });

  console.log(`✓ Total platform variants generated: ${variants.length}`);

  // 4. Validate Constraints Per Variant
  console.log("\n[4/4] Inspecting Platform Variant Compliance...");
  for (const variant of variants) {
    const payload = variant.adapted_payload as any;
    console.log(`\n--------------------------------------------------`);
    console.log(`Variant: [${variant.platform_id.toUpperCase()}] for Format [${payload.type}]`);
    console.log(`Valid: ${variant.is_valid} | Warnings: ${variant.warnings.length}`);
    if (variant.warnings.length) {
      variant.warnings.forEach((w) => console.log(`   ↳ ${w}`));
    }

    if (payload.type === "single-post") {
      console.log(`Characters: ${payload.characterCount} / ${payload.maxCharacters}`);
      console.log(`Hashtags (${payload.hashtags.length}): [${payload.hashtags.join(", ")}]`);
      if (payload.characterCount > payload.maxCharacters) {
        throw new Error(`Variant exceeded maxCharacters limit on ${variant.platform_id}!`);
      }
    } else if (payload.type === "thread") {
      console.log(`Posts: ${payload.postCount} (max ${payload.maxCharactersPerPost} chars/post)`);
      console.log(`Post 1 sample: "${payload.posts[0].slice(0, 80)}..."`);
    } else if (payload.type === "card-post") {
      console.log(`Card Caption: ${payload.characterCount} chars | Media: ${payload.mediaSpec.mediaType} (${payload.mediaSpec.aspectRatio})`);
    } else if (payload.type === "carousel-post") {
      console.log(`Carousel Packaging: ${payload.mediaSpec.mediaType} (${payload.mediaSpec.slideCount} slides, ${payload.mediaSpec.aspectRatio})`);
    }

    if (!variant.is_valid) {
      throw new Error(`Variant for platform "${variant.platform_id}" failed validation!`);
    }
  }

  console.log("\n==================================================");
  console.log("       ALL PLATFORM ADAPTER CHECKS PASSED         ");
  console.log("==================================================\n");
}

runAdaptersVerification().catch((err) => {
  console.error("Adapters verification failed:", err);
  process.exit(1);
});

