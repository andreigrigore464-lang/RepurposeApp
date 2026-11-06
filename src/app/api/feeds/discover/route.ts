/**
 * RSS/Atom & YouTube Feed Discovery API Handler
 * Inspects a publication URL, website, or YouTube channel handle to detect available feeds.
 * System Layer: api / feeds / discover
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverRssFeeds } from "@/pipeline/1-ingest/discover-rss-feeds";
import { discoverYoutubeFeed } from "@/pipeline/1-ingest/discover-youtube-feed";

const DiscoverRequestSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = DiscoverRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid URL provided", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const rawUrl = parsed.data.url.trim();
    const isYoutube =
      rawUrl.includes("youtube.com") ||
      rawUrl.includes("youtu.be") ||
      rawUrl.startsWith("@");

    if (isYoutube) {
      const ytFeed = await discoverYoutubeFeed(rawUrl);
      if (ytFeed) {
        return NextResponse.json({
          success: true,
          feeds: [
            {
              feedUrl: ytFeed.feedUrl,
              title: ytFeed.channelTitle,
              type: "atom",
              isYoutube: true,
              channelId: ytFeed.channelId,
              thumbnailUrl: ytFeed.thumbnailUrl,
            },
          ],
        });
      }
    }

    const feeds = await discoverRssFeeds(rawUrl);

    return NextResponse.json({
      success: true,
      feeds,
    });
  } catch (err) {
    console.error("[feeds:discover] Discovery error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to discover feeds" },
      { status: 500 }
    );
  }
}
