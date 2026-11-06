/**
 * Article Deduplication Logic
 * Normalizes URLs and computes a deterministic SHA-256 content hash of article text.
 * Pipeline Stage: 1-ingest
 */

import { createHash } from "node:crypto";

export interface ArticleFingerprint {
  normalizedUrl: string;
  contentHash: string;
}

/**
 * Normalizes a URL by stripping marketing tracking parameters and anchors.
 */
export function normalizeCanonicalUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Remove query params commonly used for marketing/tracking
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "_ga",
    ];

    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    parsed.hash = ""; // strip anchor hash

    // Normalize trailing slash
    let clean = parsed.href;
    if (clean.endsWith("/") && parsed.pathname !== "/") {
      clean = clean.slice(0, -1);
    }
    return clean;
  } catch {
    return rawUrl.trim();
  }
}

/**
 * Computes a SHA-256 hash of the cleaned article text to detect identical body republishes.
 */
export function computeContentHash(cleanText: string): string {
  return createHash("sha256")
    .update(cleanText.trim().replace(/\s+/g, " "))
    .digest("hex");
}

export function generateArticleFingerprint(url: string, cleanText: string): ArticleFingerprint {
  return {
    normalizedUrl: normalizeCanonicalUrl(url),
    contentHash: computeContentHash(cleanText),
  };
}

