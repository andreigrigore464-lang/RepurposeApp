/**
 * Manual Feed Polling API Route Handler
 * Triggers on-demand polling for a single RSS feed or all registered brand feeds.
 * System Layer: api / feeds / poll
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentContext } from "@/lib/current-context";
import { getFeedById, listFeedsForBrand } from "@/db/queries-feeds";
import { pollFeedAndIngestArticles } from "@/pipeline/1-ingest/poll-feed";

const PollRequestSchema = z.object({
  feedId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    let body = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable for polling all feeds
    }

    const parsed = PollRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid poll request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const targetFeedId = parsed.data.feedId;

    if (targetFeedId) {
      const feed = await getFeedById(targetFeedId);
      if (!feed || feed.brand_id !== brandId) {
        return NextResponse.json({ error: "Feed not found." }, { status: 404 });
      }

      console.log(`[ingest:poll] Starting manual poll for feed=${feed.id} url="${feed.feed_url}"`);
      const pollResult = await pollFeedAndIngestArticles(feed);

      if (pollResult.error) {
        return NextResponse.json(
          {
            success: false,
            error: `Could not reach feed "${feed.title || feed.feed_url}": ${pollResult.error}`,
            polledFeedsCount: 1,
            results: [pollResult],
            newArticlesCount: 0,
          },
          { status: 422 }
        );
      }

      return NextResponse.json({
        success: true,
        polledFeedsCount: 1,
        results: [pollResult],
        newArticlesCount: pollResult.newArticles.length,
        message: `Polled "${feed.title || feed.feed_url}": found ${pollResult.totalFound} items (${pollResult.newArticles.length} new, ${pollResult.skippedDuplicates} skipped).`,
      });
    }

    // Otherwise poll all feeds for this brand
    const feeds = await listFeedsForBrand(brandId);
    if (feeds.length === 0) {
      return NextResponse.json({
        success: true,
        polledFeedsCount: 0,
        results: [],
        newArticlesCount: 0,
        message: "No registered feeds to poll.",
      });
    }

    console.log(`[ingest:poll] Starting manual poll for all ${feeds.length} feeds in brand=${brandId}`);
    const results = [];
    let totalNew = 0;
    let failedFeeds = 0;

    for (const feed of feeds) {
      try {
        const res = await pollFeedAndIngestArticles(feed);
        if (res.error) failedFeeds++;
        totalNew += res.newArticles.length;
        results.push(res);
      } catch (feedErr: any) {
        failedFeeds++;
        results.push({
          feedId: feed.id,
          totalFound: 0,
          newArticles: [],
          skippedDuplicates: 0,
          failedArticles: 0,
          error: feedErr.message,
        });
      }
    }

    const failedNote = failedFeeds > 0 ? ` (${failedFeeds} feed(s) unreachable)` : "";

    return NextResponse.json({
      success: true,
      polledFeedsCount: feeds.length,
      results,
      newArticlesCount: totalNew,
      message: `Polled ${feeds.length} feed(s): ingested ${totalNew} new article(s)${failedNote}.`,
    });
  } catch (err: any) {
    console.error("[ingest:poll] Manual poll failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Manual feed polling failed." },
      { status: 500 }
    );
  }
}
