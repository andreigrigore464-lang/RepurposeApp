/**
 * Article Pipeline Retry API Route
 * Re-runs format generation and platform adaptation for an article that was interrupted or failed.
 * System Layer: api / articles
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/db/client";
import { runArticlePipeline } from "@/pipeline/run-article-pipeline";
import { getInboxArticlesForBrand } from "@/db/queries-inbox";
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

    console.log(`[pipeline:retry] Triggering pipeline retry for article=${parsed.data.articleId}`);
    const result = await runArticlePipeline(parsed.data.articleId);

    // Fetch updated formats for this brand to return directly to the caller
    const { brandId } = await getCurrentContext();
    const allArticles = await getInboxArticlesForBrand(brandId);
    const updatedArticle = allArticles.find((a) => a.id === parsed.data.articleId);

    return NextResponse.json({
      success: true,
      result,
      article: updatedArticle || null,
    });
  } catch (err: any) {
    console.error("[pipeline:retry] Error during pipeline execution:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline execution failed." },
      { status: 500 }
    );
  }
}

