/**
 * Video Repurpose API Route
 * Creates source article record and enqueues video_render_jobs for the Python worker.
 * System Layer: api / repurpose / video
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getCurrentContext } from "@/lib/current-context";
import { supabase } from "@/db/client";
import { createVideoRenderJob } from "@/db/queries-video-jobs";

export async function POST(req: NextRequest) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();

    const {
      sourceType, // "youtube" | "video_upload"
      videoUrl, // YouTube URL or R2 storage key
      title,
      thumbnailUrl,
      durationSeconds,
      templateId,
      framingMode, // "smart_zoom" | "blurred_background" | "center_crop"
      viewport, // { top: number, bottom: number } optional margins
      clipSelectionMode, // "ai_auto" | "manual"
      clipsCount,
      targetDuration, // "15-30" | "30-60" | "60-90"
      manualTimestamps,
      language,
      vocabularyHint,
    } = body;

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json({ error: "Missing required video URL or storage key." }, { status: 400 });
    }

    const cleanTitle = (title && typeof title === "string" ? title.trim() : "") || "Untitled Video";
    const canonicalUrl =
      sourceType === "youtube"
        ? videoUrl
        : `r2://${process.env.R2_BUCKET_NAME || "repurpose-media"}/${videoUrl}`;

    const contentHash = createHash("sha256")
      .update(`${brandId}:${canonicalUrl}:${Date.now()}`)
      .digest("hex");

    // 1. Insert or reuse source record in articles table
    const { data: article, error: articleErr } = await supabase
      .from("articles")
      .insert({
        brand_id: brandId,
        canonical_url: canonicalUrl,
        content_hash: contentHash,
        title: cleanTitle,
        clean_text: "", // Populated by worker once transcribed
        source_type: sourceType || "video_upload",
        in_article_images: thumbnailUrl ? [thumbnailUrl] : [],
        media_metadata: {
          duration_seconds: durationSeconds || 0,
          thumbnail_url: thumbnailUrl || null,
          storage_key: sourceType === "video_upload" ? videoUrl : null,
          source_type: sourceType,
        },
        status: "queued",
      })
      .select()
      .single();

    if (articleErr || !article) {
      throw new Error(`Failed to create article record: ${articleErr?.message}`);
    }

    // 2. Enqueue in video_render_jobs table
    const jobConfig = {
      source_type: sourceType,
      video_url: videoUrl,
      canonical_url: canonicalUrl,
      template_id: templateId || undefined,
      framing_mode: framingMode || "smart_zoom",
      viewport: viewport || undefined,
      clip_selection_mode: clipSelectionMode || "ai_auto",
      clips_count: Math.min(Math.max(clipsCount || 3, 1), 5),
      target_duration: targetDuration || "30-60",
      manual_timestamps: Array.isArray(manualTimestamps) ? manualTimestamps : [],
      language: language || undefined,
      vocabulary_hint: vocabularyHint || undefined,
      thumbnail_url: thumbnailUrl || undefined,
    };

    const renderJob = await createVideoRenderJob({
      brandId,
      articleId: article.id,
      configJson: jobConfig,
    });

    console.log(
      `[api:repurpose:video] Enqueued job=${renderJob.id} for article=${article.id} ("${cleanTitle}")`
    );

    return NextResponse.json({
      success: true,
      articleId: article.id,
      jobId: renderJob.id,
      status: renderJob.status,
    });
  } catch (err: any) {
    console.error("[api:repurpose:video] Error enqueuing video job:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to enqueue video repurposing job." },
      { status: 500 }
    );
  }
}

