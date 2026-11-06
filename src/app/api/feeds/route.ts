/**
 * Feeds Management API Route
 * Handles listing configured RSS/Atom feeds and adding new feeds.
 * System Layer: api
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentContext } from "@/lib/current-context";
import { listFeedsForBrand, insertFeed, deleteFeed } from "@/db/queries-feeds";

const AddFeedSchema = z.object({
  feedUrl: z.string().url(),
  title: z.string().optional(),
});

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const feeds = await listFeedsForBrand(brandId);
    return NextResponse.json({ feeds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();
    const parsed = AddFeedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid feed parameters", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const feed = await insertFeed({
      brandId,
      feedUrl: parsed.data.feedUrl,
      title: parsed.data.title,
    });

    return NextResponse.json({ feed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing feed id parameter" }, { status: 400 });
    }

    await deleteFeed(id, brandId);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

