/**
 * Smart RSS/Atom Publication Discovery
 * Detects and extracts valid RSS/Atom feed links from website URLs or direct feed URLs.
 * Pipeline Stage: 1-ingest
 */

import { fetchRssFeed } from "./fetch-rss-feed";

export interface DiscoveredFeed {
  feedUrl: string;
  title: string;
  description?: string;
  siteUrl: string;
  faviconUrl?: string;
  sampleItems: { title: string; link: string; publishedAt?: string }[];
}

/**
 * Discovers RSS or Atom feeds for a given URL (either website or direct feed).
 */
export async function discoverRssFeeds(inputUrl: string): Promise<DiscoveredFeed[]> {
  let normalizedUrl = inputUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error(`Invalid URL: ${inputUrl}`);
  }

  const origin = parsedUrl.origin;
  const faviconUrl = `${origin}/favicon.ico`;

  // 1. Try parsing directly in case user supplied an exact RSS/Atom XML link
  try {
    const directResult = await fetchRssFeed(normalizedUrl, 5000);
    if (directResult.items.length > 0 || directResult.feedTitle) {
      return [
        {
          feedUrl: normalizedUrl,
          title: directResult.feedTitle || parsedUrl.hostname,
          description: directResult.feedDescription,
          siteUrl: origin,
          faviconUrl,
          sampleItems: directResult.items.slice(0, 5).map((it) => ({
            title: it.title,
            link: it.link,
            publishedAt: it.publishedAt,
          })),
        },
      ];
    }
  } catch {
    // Not a direct XML feed, continue with HTML inspection
  }

  // 2. Fetch HTML page to inspect <link rel="alternate"> tags
  let html = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ArticleRepurposeBot/1.0 (+https://repurpose.local; contact@repurpose.local)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);
    if (res.ok) {
      html = await res.text();
    }
  } catch {
    // If fetching current URL fails, fallback to probing standard endpoints
  }

  const candidateUrls = new Set<string>();

  if (html) {
    // Extract RSS/Atom link tags using regex (avoiding heavy DOM parser dependencies)
    const linkRegex = /<link[^>]+rel=["'](?:alternate|service\.feed)["'][^>]*>/gi;
    const matches = html.match(linkRegex) || [];

    for (const match of matches) {
      const typeMatch = match.match(/type=["'](application\/(?:rss\+xml|atom\+xml|xml)|text\/xml)["']/i);
      if (!typeMatch) continue;

      const hrefMatch = match.match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;

      let href = hrefMatch[1].trim();

      // Filter out comment feeds
      if (/comments|comment-feed/i.test(href)) {
        continue;
      }

      try {
        const absoluteUrl = new URL(href, normalizedUrl).href;
        candidateUrls.add(absoluteUrl);
      } catch {
        // ignore malformed URLs
      }
    }
  }

  // If no candidates discovered in HTML <link>, probe common standard paths
  if (candidateUrls.size === 0) {
    const standardPaths = [
      "/feed",
      "/rss",
      "/rss.xml",
      "/atom.xml",
      "/index.xml",
      `${parsedUrl.pathname.replace(/\/$/, "")}/feed`,
      `${parsedUrl.pathname.replace(/\/$/, "")}/rss`,
    ];

    for (const path of standardPaths) {
      try {
        const testUrl = new URL(path, origin).href;
        candidateUrls.add(testUrl);
      } catch {
        // ignore
      }
    }
  }

  const discovered: DiscoveredFeed[] = [];

  // Probe candidates in parallel (capped limit)
  const candidatesArray = Array.from(candidateUrls).slice(0, 6);
  const probePromises = candidatesArray.map(async (candidate) => {
    try {
      const result = await fetchRssFeed(candidate, 5000);
      if (result.items.length > 0 || result.feedTitle) {
        return {
          feedUrl: candidate,
          title: result.feedTitle || `${parsedUrl.hostname} Feed`,
          description: result.feedDescription,
          siteUrl: origin,
          faviconUrl,
          sampleItems: result.items.slice(0, 5).map((it) => ({
            title: it.title,
            link: it.link,
            publishedAt: it.publishedAt,
          })),
        };
      }
    } catch {
      return null;
    }
    return null;
  });

  const probeResults = await Promise.all(probePromises);
  for (const res of probeResults) {
    if (res && !discovered.some((d) => d.feedUrl === res.feedUrl)) {
      discovered.push(res);
    }
  }

  return discovered;
}

