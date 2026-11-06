/**
 * Video Repurpose Job Status API Route
 * Provides live progress tracking for video transcription and rendering.
 * System Layer: api / repurpose / video / status
 */

import { NextRequest, NextResponse } from "next/server";
import { getVideoRenderJobById } from "@/db/queries-video-jobs";
import { listFormatOutputsForArticle } from "@/db/queries-format-outputs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Missing required 'jobId' query parameter." }, { status: 400 });
    }

    const job = await getVideoRenderJobById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    // Fetch any completed format outputs (reels) for this article
    const formats = await listFormatOutputsForArticle(job.article_id);

    return NextResponse.json({
      jobId: job.id,
      articleId: job.article_id,
      status: job.status,
      progressPct: job.progress_pct,
      stageMessage: job.stage_message,
      errorMessage: job.error_message,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      formats: formats.map((f) => ({
        id: f.id,
        formatKind: f.format_kind,
        status: f.status,
        slotsData: f.slots_data,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch job status." },
      { status: 500 }
    );
  }
}

