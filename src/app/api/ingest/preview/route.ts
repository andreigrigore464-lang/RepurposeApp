/**
 * Article Preview & Unfurl API Handler
 * Extracts article text, metadata, and in-article images from a URL without consuming LLM tokens.
 * System Layer: api / ingest / preview
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchAndExtractArticle } from "@/pipeline/1-ingest/extract-article";

const PreviewRequestSchema = z.object({
  url: z.string().url("A valid URL is required."),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = PreviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const extracted = await fetchAndExtractArticle(parsed.data.url);
    const words = extracted.cleanText.split(/\s+/).filter(Boolean);
    const excerpt =
      extracted.cleanText.length > 320
        ? `${extracted.cleanText.slice(0, 320).trim()}...`
        : extracted.cleanText;

    return NextResponse.json({
      success: true,
      title: extracted.title,
      author: extracted.author,
      publishedAt: extracted.publishedAt,
      canonicalUrl: extracted.canonicalUrl,
      wordCount: words.length,
      excerpt,
      inArticleImages: extracted.inArticleImages,
    });
  } catch (err) {
    console.error("[ingest:preview] Failed to preview article:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to extract article preview." },
      { status: 500 }
    );
  }
}

