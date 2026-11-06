/**
 * HTML Article Extractor
 * Extracts title, author, publication date, cleaned body text, and in-article images from webpage HTML.
 * Pipeline Stage: 1-ingest
 */

import * as cheerio from "cheerio";

export interface ExtractedArticle {
  canonicalUrl: string;
  title: string;
  author?: string;
  publishedAt?: string;
  rawHtml: string;
  cleanText: string;
  inArticleImages: string[];
}

export async function fetchAndExtractArticle(url: string, timeoutMs = 10000): Promise<ExtractedArticle> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let rawHtml: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ArticleRepurposeBot/1.0 (+https://repurpose.local; contact@repurpose.local)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch article from ${url}: HTTP ${res.status} ${res.statusText}`);
    }

    rawHtml = await res.text();
  } finally {
    clearTimeout(timer);
  }

  return extractArticleFromHtml(rawHtml, url);
}

export function extractArticleFromHtml(rawHtml: string, fallbackUrl: string): ExtractedArticle {
  const $ = cheerio.load(rawHtml);

  // 1. Resolve canonical URL
  const canonicalTag = $('link[rel="canonical"]').attr("href");
  let canonicalUrl = fallbackUrl;
  if (canonicalTag) {
    try {
      canonicalUrl = new URL(canonicalTag, fallbackUrl).href;
    } catch {
      canonicalUrl = fallbackUrl;
    }
  }

  // 2. Extract Title
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const twitterTitle = $('meta[name="twitter:title"]').attr("content");
  const docTitle = $("title").text();
  const h1Title = $("h1").first().text();
  const title = (ogTitle || twitterTitle || h1Title || docTitle || "Untitled Article").trim();

  // 3. Extract Author
  const authorMeta =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    $('[rel="author"]').first().text() ||
    $(".byline, .author").first().text();
  const author = authorMeta ? authorMeta.trim() : undefined;

  // 4. Extract Publication Date
  const dateMeta =
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="publish-date"]').attr("content") ||
    $("time").first().attr("datetime") ||
    $("time").first().text();
  const publishedAt = dateMeta ? dateMeta.trim() : undefined;

  // 5. Remove unwanted noise elements before extracting content and images
  $("script, style, noscript, nav, footer, header, aside, .advertisement, .ad, .comments, .sidebar").remove();

  // 6. Find the main article container
  const articleContainer = $("article").length > 0 ? $("article") : $("main").length > 0 ? $("main") : $("body");

  // 7. Extract in-article images (strictly bounded by physical article images)
  const inArticleImages: string[] = [];
  articleContainer.find("img, picture source").each((_, el) => {
    let src =
      $(el).attr("data-src") ||
      $(el).attr("data-original") ||
      $(el).attr("data-actualsrc") ||
      $(el).attr("src") ||
      $(el).attr("srcset")?.split(",")?.[0]?.trim()?.split(" ")?.[0];

    if (!src) return;

    // Filter out data URLs, tiny tracking pixels, common social icons, and placeholder/spacer images
    const lower = src.toLowerCase();
    if (
      lower.startsWith("data:") ||
      lower.includes("tracking") ||
      lower.endsWith(".svg") ||
      lower.includes("placeholder") ||
      lower.includes("spacer") ||
      lower.includes("blank.gif") ||
      lower.includes("pixel")
    ) {
      // If it was a placeholder, look for real image on data-src or parent picture srcset
      const altSrc =
        $(el).attr("data-src") ||
        $(el).attr("data-original") ||
        $(el).attr("srcset")?.split(",")?.[0]?.trim()?.split(" ")?.[0] ||
        $(el).closest("picture").find("source").first().attr("srcset")?.split(",")?.[0]?.trim()?.split(" ")?.[0];

      if (altSrc && !altSrc.toLowerCase().includes("placeholder")) {
        src = altSrc;
      } else {
        return;
      }
    }

    try {
      const resolvedUrl = new URL(src, canonicalUrl).href;
      if (!inArticleImages.includes(resolvedUrl)) {
        inArticleImages.push(resolvedUrl);
      }
    } catch {
      // Ignore malformed image URLs
    }
  });

  // 8. Extract and clean body text paragraphs
  const paragraphs: string[] = [];
  articleContainer.find("p, h2, h3, h4, blockquote, li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 20) {
      paragraphs.push(text);
    }
  });

  const cleanText = paragraphs.join("\n\n");

  if (!cleanText || cleanText.length < 50) {
    throw new Error(`Extracted article content is too short (${cleanText.length} chars) from ${canonicalUrl}`);
  }

  return {
    canonicalUrl,
    title,
    author,
    publishedAt,
    rawHtml,
    cleanText,
    inArticleImages,
  };
}

