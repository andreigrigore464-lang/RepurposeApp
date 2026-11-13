/**
 * Brand Reel Feedback API Route
 * Handles retrieving and recording user rating/feedback on vertical reel outputs
 * to continuously improve AI hook selection and channel taste memory.
 * System Layer: api / brand / reel-feedback
 */

import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { getReelFeedback, saveReelFeedback } from "@/db/queries-brand-kit";

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const feedback = await getReelFeedback(brandId);
    return NextResponse.json({ feedback });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();

    if (!body || !body.formatOutputId || !body.rating) {
      return NextResponse.json(
        { error: "Missing required fields: formatOutputId and rating ('yes' | 'no')." },
        { status: 400 }
      );
    }

    if (body.rating !== "yes" && body.rating !== "no") {
      return NextResponse.json(
        { error: "Invalid rating value. Must be 'yes' or 'no'." },
        { status: 400 }
      );
    }

    await saveReelFeedback(brandId, {
      format_output_id: body.formatOutputId,
      rating: body.rating,
      comment: body.comment ? String(body.comment).trim() : undefined,
      hook_text: body.hookText ? String(body.hookText).trim() : undefined,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[brand/reel-feedback] Save error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

