/**
 * Raw Text & Markdown Ingestion Pipeline Action
 * Ingests user-pasted text, notes, or paywalled drafts directly into the article repository.
 * Pipeline Stage: 1-ingest
 */

import { generateArticleFingerprint } from "./deduplicate-article";
import { findArticleByUrlOrHash, insertArticle, ArticleRecord } from "../../db/queries-articles";

export interface IngestRawTextParams {
  brandId: string;
  title: string;
  cleanText: string;
  canonicalUrl?: string;
  author?: string;
  publishedAt?: string;
  inArticleImages?: string[];
}

export interface IngestRawTextResult {
  article: ArticleRecord;
  isDuplicate: boolean;
}

export async function ingestRawText(params: IngestRawTextParams): Promise<IngestRawTextResult> {
  const title = params.title.trim() || "Untitled Text Article";
  const cleanText = params.cleanText.trim();

  if (!cleanText) {
    throw new Error("Cannot ingest article: clean text is empty.");
  }

  // If no canonical URL provided, construct an internal draft identifier
  const fallbackUrl = `draft://${encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-${Date.now()}`;
  const effectiveUrl = params.canonicalUrl?.trim() || fallbackUrl;

  const fingerprint = generateArticleFingerprint(effectiveUrl, cleanText);

  // Check if article already exists for this brand
  const existing = await findArticleByUrlOrHash({
    brandId: params.brandId,
    canonicalUrl: fingerprint.normalizedUrl,
    contentHash: fingerprint.contentHash,
  });

  if (existing) {
    console.log(`[ingest-text] article=${existing.id} status=skipped_duplicate title="${title}"`);
    return {
      article: existing,
      isDuplicate: true,
    };
  }

  const article = await insertArticle({
    brandId: params.brandId,
    canonicalUrl: fingerprint.normalizedUrl,
    contentHash: fingerprint.contentHash,
    title,
    author: params.author?.trim() || "Author",
    publishedAt: params.publishedAt || new Date().toISOString(),
    rawHtml: `<p>${cleanText.replace(/\n\n+/g, "</p><p>")}</p>`,
    cleanText,
    inArticleImages: params.inArticleImages || [],
  });

  console.log(
    `[ingest-text] article=${article.id} status=success chars=${article.clean_text.length}`
  );

  return {
    article,
    isDuplicate: false,
  };
}

