/**
 * Article Pipeline Retry API Route
 * Re-runs format generation and platform adaptation for an article that was interrupted or failed.
 * System Layer: api / articles
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/db/client";
import { dispatchArticlePipeline } from "@/jobs/dispatch-pipeline";
import { getCurrentContext } from "@/lib/current-context";

const RetrySchema = z.object({
  articleId: z.string().uuid("Invalid article ID"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RetrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid article ID", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { brandId } = await getCurrentContext();
    const articleId = parsed.data.articleId;

    console.log(`[pipeline:retry] Dispatching pipeline retry for article=${articleId}`);

    // Reset error state and mark as processing
    await supabase
      .from("articles")
      .update({
        status: "processing",
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    await dispatchArticlePipeline({
      articleId,
      brandId,
      options: { force: true },
    });

    return NextResponse.json({
      success: true,
      articleId,
      status: "processing",
      message: "Pipeline retry queued successfully.",
    });
  } catch (err: any) {
    console.error("[pipeline:retry] Error during pipeline execution:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline execution failed." },
      { status: 500 }
    );
  }
}

