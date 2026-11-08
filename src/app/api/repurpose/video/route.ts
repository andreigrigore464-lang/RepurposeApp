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
import { getBrandTemplate } from "@/render/load-brand-template";
import { VideoElement, CaptionsElement } from "@/render/template-schema";

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

    // 2. Resolve visual layout from Template (Option A: Single Source of Truth)
    let templateConfig: {
      framing_mode: string;
      viewport?: { top: number; bottom: number; left: number; right: number };
      font_name: string;
      font_size: number;
      primary_color: string;
      highlight_color: string;
    };

    if (templateId === "preset:blurred_background") {
      templateConfig = {
        framing_mode: "blurred_background",
        viewport: { top: 0, bottom: 0, left: 0, right: 0 },
        font_name: "Anton",
        font_size: 92,
        primary_color: "#BDDF3C",
        highlight_color: "#FFFFFF",
      };
    } else if (templateId === "preset:center_crop") {
      templateConfig = {
        framing_mode: "center_crop",
        viewport: { top: 0, bottom: 0, left: 0, right: 0 },
        font_name: "Anton",
        font_size: 92,
        primary_color: "#BDDF3C",
        highlight_color: "#FFFFFF",
      };
    } else if (templateId === "manual") {
      templateConfig = {
        framing_mode: framingMode || "smart_zoom",
        viewport: viewport || { top: 0, bottom: 0, left: 0, right: 0 },
        font_name: "Anton",
        font_size: 92,
        primary_color: "#BDDF3C",
        highlight_color: "#FFFFFF",
      };
    } else if (templateId && !templateId.startsWith("preset:")) {
      // Custom user template from Template Designer
      try {
        const brandTemplate = await getBrandTemplate(brandId, "video-reel", templateId);
        const elements = brandTemplate?.pages?.[0]?.elements || [];
        const videoEl =
          elements.find((e): e is VideoElement => e.type === "video" && e.id !== "bg-video-blur") ||
          elements.find((e): e is VideoElement => e.type === "video");
        const captionEl = elements.find((e): e is CaptionsElement => e.type === "captions");

        let resolvedFraming = "smart_zoom";
        if (videoEl?.framing_mode) {
          const fm = String(videoEl.framing_mode);
          if (fm === "blurred_stack" || fm === "contain" || fm === "blurred_background") {
            resolvedFraming = "blurred_background";
          } else if (fm === "cover" || fm === "center_crop") {
            resolvedFraming = "center_crop";
          } else {
            resolvedFraming = "smart_zoom";
          }
        }

        const top = videoEl?.y || 0;
        const bottom = videoEl ? Math.max(0, 1920 - (videoEl.y + videoEl.height)) : 0;
        const left = videoEl?.x || 0;
        const right = videoEl ? Math.max(0, 1080 - (videoEl.x + videoEl.width)) : 0;

        templateConfig = {
          framing_mode: resolvedFraming,
          viewport: { top, bottom, left, right },
          font_name: captionEl?.font_family || "Anton",
          font_size: captionEl?.font_size || 92,
          primary_color: captionEl?.primary_color || "#BDDF3C",
          highlight_color: captionEl?.highlight_color || "#FFFFFF",
        };
      } catch (err: any) {
        console.warn(`[api:repurpose:video] Could not load template=${templateId}, using smart_zoom default:`, err?.message);
        templateConfig = {
          framing_mode: "smart_zoom",
          viewport: { top: 0, bottom: 0, left: 0, right: 0 },
          font_name: "Anton",
          font_size: 92,
          primary_color: "#BDDF3C",
          highlight_color: "#FFFFFF",
        };
      }
    } else {
      // Default: Fullscreen Smart Subject Zoom
      templateConfig = {
        framing_mode: "smart_zoom",
        viewport: { top: 0, bottom: 0, left: 0, right: 0 },
        font_name: "Anton",
        font_size: 92,
        primary_color: "#BDDF3C",
        highlight_color: "#FFFFFF",
      };
    }

    // 3. Enqueue in video_render_jobs table
    const jobConfig = {
      source_type: sourceType,
      video_url: videoUrl,
      canonical_url: canonicalUrl,
      template_id: templateId || undefined,
      template_config: templateConfig,
      framing_mode: templateConfig.framing_mode,
      viewport: templateConfig.viewport,
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

