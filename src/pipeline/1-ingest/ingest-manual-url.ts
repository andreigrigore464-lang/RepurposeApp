/**
 * Manual URL Ingestion Pipeline Action
 * Coordinates fetching, extracting, deduplicating, and persisting an article from a raw URL.
 * Pipeline Stage: 1-ingest
 */

import { fetchAndExtractArticle } from "./extract-article";
import { generateArticleFingerprint } from "./deduplicate-article";
import { findArticleByUrlOrHash, insertArticle, ArticleRecord } from "../../db/queries-articles";

export interface IngestUrlResult {
  article: ArticleRecord;
  isDuplicate: boolean;
}

export async function ingestManualUrl(params: {
  url: string;
  brandId: string;
}): Promise<IngestUrlResult> {
  const extracted = await fetchAndExtractArticle(params.url);
  const fingerprint = generateArticleFingerprint(extracted.canonicalUrl, extracted.cleanText);

  // Check if article already exists for this brand
  const existing = await findArticleByUrlOrHash({
    brandId: params.brandId,
    canonicalUrl: fingerprint.normalizedUrl,
    contentHash: fingerprint.contentHash,
  });

  if (existing) {
    console.log(`[ingest] article=${existing.id} status=skipped_duplicate url=${fingerprint.normalizedUrl}`);
    return {
      article: existing,
      isDuplicate: true,
    };
  }

  const article = await insertArticle({
    brandId: params.brandId,
    canonicalUrl: fingerprint.normalizedUrl,
    contentHash: fingerprint.contentHash,
    title: extracted.title,
    author: extracted.author,
    publishedAt: extracted.publishedAt,
    rawHtml: extracted.rawHtml,
    cleanText: extracted.cleanText,
    inArticleImages: extracted.inArticleImages,
  });

  console.log(
    `[ingest] article=${article.id} status=success images=${article.in_article_images.length} chars=${article.clean_text.length}`
  );

  return {
    article,
    isDuplicate: false,
  };
}

