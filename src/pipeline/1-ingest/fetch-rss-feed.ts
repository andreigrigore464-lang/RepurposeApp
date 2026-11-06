/**
 * RSS Feed Fetcher & Parser
 * Fetches and parses RSS 2.0 and Atom feeds into a normalized item list.
 * Pipeline Stage: 1-ingest
 */

import { XMLParser } from "fast-xml-parser";

export interface NormalizedFeedItem {
  title: string;
  link: string;
  guid?: string;
  publishedAt?: string;
  summary?: string;
}

export interface FeedParseResult {
  feedTitle?: string;
  feedDescription?: string;
  items: NormalizedFeedItem[];
}

export async function fetchRssFeed(feedUrl: string, timeoutMs = 10000): Promise<FeedParseResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let xmlText: string;
  try {
    const res = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ArticleRepurposeBot/1.0 (+https://repurpose.local; contact@repurpose.local)",
        "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }

    xmlText = await res.text();
  } finally {
    clearTimeout(timer);
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    trimValues: true,
  });

  const parsed = parser.parse(xmlText);

  // Check for RSS 2.0 (<rss><channel><item>...)
  if (parsed.rss && parsed.rss.channel) {
    const channel = parsed.rss.channel;
    const rawItems = channel.item ? (Array.isArray(channel.item) ? channel.item : [channel.item]) : [];

    const items: NormalizedFeedItem[] = rawItems.map((it: any) => ({
      title: it.title || "Untitled",
      link: it.link || (typeof it.guid === "string" ? it.guid : ""),
      guid: typeof it.guid === "object" ? it.guid["#text"] : it.guid,
      publishedAt: it.pubDate || it.published || it["dc:date"],
      summary: it.description || it["content:encoded"],
    })).filter((it: NormalizedFeedItem) => Boolean(it.link));

    return {
      feedTitle: channel.title,
      feedDescription: channel.description,
      items,
    };
  }

  // Check for Atom (<feed><entry>...)
  if (parsed.feed) {
    const feed = parsed.feed;
    const rawEntries = feed.entry ? (Array.isArray(feed.entry) ? feed.entry : [feed.entry]) : [];

    const items: NormalizedFeedItem[] = rawEntries.map((en: any) => {
      let link = "";
      if (typeof en.link === "string") {
        link = en.link;
      } else if (Array.isArray(en.link)) {
        const alt = en.link.find((l: any) => l["@_rel"] === "alternate") || en.link[0];
        link = alt ? alt["@_href"] : "";
      } else if (en.link && en.link["@_href"]) {
        link = en.link["@_href"];
      }

      return {
        title: typeof en.title === "object" ? en.title["#text"] : en.title || "Untitled",
        link,
        guid: en.id,
        publishedAt: en.published || en.updated,
        summary: typeof en.summary === "object" ? en.summary["#text"] : en.summary,
      };
    }).filter((it: NormalizedFeedItem) => Boolean(it.link));

    return {
      feedTitle: typeof feed.title === "object" ? feed.title["#text"] : feed.title,
      feedDescription: feed.subtitle,
      items,
    };
  }

  throw new Error("Unrecognized feed format (neither RSS 2.0 nor Atom document)");
}

