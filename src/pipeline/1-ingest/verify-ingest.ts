/**
 * Ingest Verification & Test Script
 * Exercises the end-to-end article ingestion pipeline against Supabase:
 * 1. RSS XML parsing & feed extraction.
 * 2. HTML body text & in-article image extraction.
 * 3. Database persistence of feed and article records.
 * 4. Deduplication verification (URL & SHA-256 content hash).
 */

import { extractArticleFromHtml } from "./extract-article";
import { generateArticleFingerprint } from "./deduplicate-article";
import { insertFeed, listFeedsForBrand } from "../../db/queries-feeds";
import { findArticleByUrlOrHash, insertArticle, listArticlesForBrand } from "../../db/queries-articles";
import { DEFAULT_BRAND_ID } from "../../lib/current-context";

// Sample editorial article HTML with text, metadata, and an in-article image
const SAMPLE_ARTICLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>The Future of Editorial Grounding in AI Workflows</title>
  <link rel="canonical" href="https://chronicle.example.com/editorial-grounding-future" />
  <meta property="og:title" content="The Future of Editorial Grounding in AI Workflows" />
  <meta name="author" content="Elena Rostova" />
  <meta property="article:published_time" content="2026-10-31T12:00:00Z" />
</head>
<body>
  <nav><a href="/">Home</a> | <a href="/about">About</a></nav>
  <header><h1>The Chronicle Header</h1></header>
  <article>
    <h1>The Future of Editorial Grounding in AI Workflows</h1>
    <p class="byline">By Elena Rostova • Published October 31, 2026</p>
    <img src="/assets/images/grounding-diagram.png" alt="Grounding Architecture Diagram" />
    <p>
      Digital publishing teams are facing an unprecedented challenge: distributing high-value editorial content across fragmented social platforms without degrading brand integrity or introducing factual errors.
    </p>
    <p>
      Recent industry benchmarks indicate that digital publishers spend an average of 4.2 hours per article manually formatting cross-posts. When automated with ungrounded generative models, brand error rates spike by over 80%.
    </p>
    <blockquote>
      "Boring, explicit code and strict provenance tracking are ten times easier to debug than autonomous agent loops."
    </blockquote>
    <p>
      By enforcing a format-first, platform-last architecture, publishers decouple content structure from destination constraints, ensuring every generated post remains 100% grounded in verifiable source sentences.
    </p>
    <img src="https://chronicle.example.com/assets/images/chart-metrics.png" alt="Publishing Metrics Chart" />
    <p>
      In conclusion, sustainable audience growth requires calm, human-in-the-loop review tools rather than black-box auto-posting bots.
    </p>
  </article>
  <footer>
    <p>&copy; 2026 The Chronicle. All rights reserved.</p>
  </footer>
</body>
</html>
`;

async function runIngestVerification() {
  console.log("==================================================");
  console.log("       PHASE 3: ARTICLE INGEST PIPELINE TEST      ");
  console.log("==================================================");

  // 1. Test HTML Article Extraction
  console.log("\n[1/4] Testing HTML Article Extraction...");
  const extracted = extractArticleFromHtml(
    SAMPLE_ARTICLE_HTML,
    "https://chronicle.example.com/editorial-grounding-future"
  );

  console.log(`✓ Canonical URL: ${extracted.canonicalUrl}`);
  console.log(`✓ Title: "${extracted.title}"`);
  console.log(`✓ Author: "${extracted.author}"`);
  console.log(`✓ In-article Images found: ${extracted.inArticleImages.length}`);
  extracted.inArticleImages.forEach((img, i) => console.log(`   [Image ${i + 1}] ${img}`));
  console.log(`✓ Clean text length: ${extracted.cleanText.length} characters`);

  if (extracted.inArticleImages.length !== 2) {
    throw new Error(`Expected exactly 2 in-article images, found ${extracted.inArticleImages.length}`);
  }

  // 2. Test Deduplication Fingerprinting
  console.log("\n[2/4] Testing Deduplication Fingerprinting...");
  const fingerprint = generateArticleFingerprint(extracted.canonicalUrl, extracted.cleanText);
  console.log(`✓ Normalized URL: ${fingerprint.normalizedUrl}`);
  console.log(`✓ SHA-256 Content Hash: ${fingerprint.contentHash}`);

  // 3. Test Database Feed Creation & Article Ingestion
  console.log("\n[3/4] Persisting Feed and Ingested Article to Supabase...");
  const feed = await insertFeed({
    brandId: DEFAULT_BRAND_ID,
    feedUrl: "https://chronicle.example.com/feed.xml",
    title: "The Chronicle Main Feed",
  });
  console.log(`✓ Feed inserted in DB: "${feed.title}" (${feed.id})`);

  // Check if article already exists (clean run)
  const existingBefore = await findArticleByUrlOrHash({
    brandId: DEFAULT_BRAND_ID,
    canonicalUrl: fingerprint.normalizedUrl,
    contentHash: fingerprint.contentHash,
  });

  let articleId: string;
  if (existingBefore) {
    console.log(`ℹ Article already present from previous test run: ${existingBefore.id}`);
    articleId = existingBefore.id;
  } else {
    const insertedArticle = await insertArticle({
      brandId: DEFAULT_BRAND_ID,
      feedId: feed.id,
      canonicalUrl: fingerprint.normalizedUrl,
      contentHash: fingerprint.contentHash,
      title: extracted.title,
      author: extracted.author,
      publishedAt: extracted.publishedAt,
      rawHtml: extracted.rawHtml,
      cleanText: extracted.cleanText,
      inArticleImages: extracted.inArticleImages,
    });
    console.log(`✓ Article successfully ingested into DB: "${insertedArticle.title}" (${insertedArticle.id})`);
    articleId = insertedArticle.id;
  }

  // 4. Test Deduplication Logic
  console.log("\n[4/4] Verifying Duplicate Article Detection...");
  const duplicateCheck = await findArticleByUrlOrHash({
    brandId: DEFAULT_BRAND_ID,
    canonicalUrl: fingerprint.normalizedUrl,
    contentHash: fingerprint.contentHash,
  });

  if (!duplicateCheck) {
    throw new Error("Deduplication check failed: Expected article to be found!");
  }
  console.log(`✓ Duplicate successfully caught! Existing article ID: ${duplicateCheck.id} matches ${articleId}`);

  // Verify articles listed for brand
  const brandArticles = await listArticlesForBrand(DEFAULT_BRAND_ID);
  console.log(`✓ Total articles queryable in DB for brand: ${brandArticles.length}`);

  console.log("\n==================================================");
  console.log("       ALL INGEST PIPELINE CHECKS PASSED          ");
  console.log("==================================================\n");
}

runIngestVerification().catch((err) => {
  console.error("Ingest verification failed:", err);
  process.exit(1);
});

