/**
 * RSS/Atom Feed Discovery API Handler
 * Inspects a publication URL to detect available RSS and Atom feeds.
 * System Layer: api / feeds / discover
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { discoverRssFeeds } from "@/pipeline/1-ingest/discover-rss-feeds";

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

    const feeds = await discoverRssFeeds(parsed.data.url);

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

