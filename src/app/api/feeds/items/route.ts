/**
 * Feed Items Stream API Handler
 * Retrieves live RSS/Atom items for a monitored feed and cross-checks ingestion status.
 * System Layer: api / feeds / items
 */

import { NextResponse } from "next/server";
import { getFeedById } from "@/db/queries-feeds";
import { fetchRssFeed } from "@/pipeline/1-ingest/fetch-rss-feed";
import { supabase } from "@/db/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const feedId = searchParams.get("feedId");

    if (!feedId) {
      return NextResponse.json({ error: "Query parameter 'feedId' is required." }, { status: 400 });
    }

    const feed = await getFeedById(feedId);
    if (!feed) {
      return NextResponse.json({ error: `Feed "${feedId}" not found.` }, { status: 404 });
    }

    const parsed = await fetchRssFeed(feed.feed_url);

    // Fetch articles already ingested for this brand
    const { data: existingArticles } = await supabase
      .from("articles")
      .select("id, canonical_url, title, status")
      .eq("brand_id", feed.brand_id);

    const ingestedUrlMap = new Map<string, { id: string; status: string }>();
    if (existingArticles) {
      for (const art of existingArticles) {
        if (art.canonical_url) {
          ingestedUrlMap.set(art.canonical_url.toLowerCase(), { id: art.id, status: art.status });
        }
      }
    }

    const items = parsed.items.map((item) => {
      const match = ingestedUrlMap.get(item.link.toLowerCase());
      return {
        title: item.title,
        link: item.link,
        publishedAt: item.publishedAt,
        summary: item.summary ? item.summary.replace(/<[^>]+>/g, "").slice(0, 200) : undefined,
        isIngested: Boolean(match),
        articleId: match?.id,
        articleStatus: match?.status,
      };
    });

    return NextResponse.json({
      success: true,
      feedTitle: feed.title || parsed.feedTitle || "Monitored Feed",
      items,
    });
  } catch (err) {
    console.error("[feeds:items] Error loading feed stream:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load feed items." },
      { status: 500 }
    );
  }
}

