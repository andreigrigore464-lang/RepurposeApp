/**
 * Ingest API Route Handler
 * Endpoint for manual URL article ingestion, raw text ingest, and pipeline execution.
 * Next.js Presentation Layer
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { ingestManualUrl } from "@/pipeline/1-ingest/ingest-manual-url";
import { ingestRawText } from "@/pipeline/1-ingest/ingest-raw-text";
import { getCurrentContext } from "@/lib/current-context";
import { runArticlePipeline } from "@/pipeline/run-article-pipeline";

const IngestRequestSchema = z.object({
  url: z.string().url().optional(),
  rawText: z.string().min(20).optional(),
  title: z.string().optional(),
  author: z.string().optional(),
  brandId: z.string().uuid().optional(),
  preferredImageUrl: z.string().url().optional(),
  workflowConfig: z
    .object({
      enabledFormats: z.array(z.string()).optional(),
      cardTemplateId: z.string().optional(),
      carouselTemplateId: z.string().optional(),
    })
    .optional(),
}).refine((data) => data.url || data.rawText, {
  message: "Either 'url' or 'rawText' must be provided.",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = IngestRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const context = await getCurrentContext();
    const brandId = parsed.data.brandId || context.brandId;

    let result;
    if (parsed.data.url) {
      result = await ingestManualUrl({
        url: parsed.data.url,
        brandId,
      });
    } else if (parsed.data.rawText) {
      result = await ingestRawText({
        brandId,
        title: parsed.data.title || "Untitled Draft",
        cleanText: parsed.data.rawText,
        author: parsed.data.author,
      });
    } else {
      throw new Error("No URL or text provided.");
    }

    // If new article, execute the full repurposing pipeline with supplied workflow rules
    if (!result.isDuplicate) {
      const workflowConfig = parsed.data.workflowConfig
        ? {
            enabledFormats: parsed.data.workflowConfig.enabledFormats || [
              "text-post",
              "thread",
              "card",
              "carousel",
            ],
            cardTemplateId: parsed.data.workflowConfig.cardTemplateId,
            carouselTemplateId: parsed.data.workflowConfig.carouselTemplateId,
          }
        : undefined;

      await runArticlePipeline(result.article.id, {
        workflowConfig,
        preferredImageUrl: parsed.data.preferredImageUrl,
      });
    }

    return NextResponse.json({
      success: true,
      articleId: result.article.id,
      title: result.article.title,
      isDuplicate: result.isDuplicate,
      status: result.isDuplicate ? result.article.status : "drafted",
    });
  } catch (err) {
    console.error("[ingest] API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal ingest error" },
      { status: 500 }
    );
  }
}
