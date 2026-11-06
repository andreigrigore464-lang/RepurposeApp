/**
 * Video Render Jobs Database Queries
 * Query operations for inserting, polling, and updating asynchronous video jobs.
 * Database Layer: db
 */

import { supabase } from "./client";

export type VideoJobStatus =
  | "queued"
  | "transcribing"
  | "selecting_hooks"
  | "rendering"
  | "completed"
  | "failed";

export interface VideoRenderJobRecord {
  id: string;
  brand_id: string;
  article_id: string;
  status: VideoJobStatus;
  progress_pct: number;
  stage_message: string;
  config_json: Record<string, any>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function createVideoRenderJob(params: {
  brandId: string;
  articleId: string;
  configJson?: Record<string, any>;
}): Promise<VideoRenderJobRecord> {
  const { data, error } = await supabase
    .from("video_render_jobs")
    .insert({
      brand_id: params.brandId,
      article_id: params.articleId,
      status: "queued",
      progress_pct: 0,
      stage_message: "Waiting in queue...",
      config_json: params.configJson || {},
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create video render job: ${error?.message}`);
  }

  return data as VideoRenderJobRecord;
}

export async function getVideoRenderJobById(
  jobId: string
): Promise<VideoRenderJobRecord | null> {
  const { data, error } = await supabase
    .from("video_render_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    console.error(`[db] Failed to fetch video render job ${jobId}:`, error.message);
    return null;
  }

  return data as VideoRenderJobRecord | null;
}

export async function getVideoRenderJobByArticleId(
  articleId: string
): Promise<VideoRenderJobRecord | null> {
  const { data, error } = await supabase
    .from("video_render_jobs")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      `[db] Failed to fetch video render job for article ${articleId}:`,
      error.message
    );
    return null;
  }

  return data as VideoRenderJobRecord | null;
}

export async function updateVideoRenderJobStatus(
  jobId: string,
  updates: {
    status?: VideoJobStatus;
    progress_pct?: number;
    stage_message?: string;
    error_message?: string | null;
  }
): Promise<boolean> {
  const { error } = await supabase
    .from("video_render_jobs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.error(`[db] Failed to update video render job ${jobId}:`, error.message);
    return false;
  }

  return true;
}

export async function listQueuedVideoJobs(
  limit = 5
): Promise<VideoRenderJobRecord[]> {
  const { data, error } = await supabase
    .from("video_render_jobs")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[db] Failed to list queued video jobs:", error.message);
    return [];
  }

  return (data || []) as VideoRenderJobRecord[];
}

