/**
 * Inbox Database Queries
 * Combines articles, digests, video render jobs, and generated format outputs for the editorial workbench inbox.
 * Resilient to pending migrations (backward-compatible).
 * System Layer: db
 */

import { supabase } from "./client";

export interface InboxFormatBadge {
  id: string;
  formatKind: string;
  status: string;
  reelIndex?: number;
  durationSeconds?: number;
}

export interface VideoJobProgressInfo {
  status: string;
  progressPct: number;
  stageMessage: string;
}

export interface InboxArticleItem {
  id: string;
  title: string;
  canonicalUrl: string;
  sourceType: string;
  mediaMetadata?: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  status: string;
  digestItemsCount: number;
  formats: InboxFormatBadge[];
  videoJob?: VideoJobProgressInfo | null;
}

export async function getInboxArticlesForBrand(brandId: string): Promise<InboxArticleItem[]> {
  // Use select("*") so missing columns during migrations do not trigger 400 Bad Request
  const { data: articles, error: articlesErr } = await supabase
    .from("articles")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (articlesErr || !articles) {
    console.error("[db] Failed to fetch articles for inbox:", articlesErr?.message);
    return [];
  }

  const articleIds = articles.map((a: any) => a.id);
  if (articleIds.length === 0) return [];

  // Fetch all completed digests for these articles
  const { data: digests } = await supabase
    .from("digests")
    .select("article_id, items, status")
    .in("article_id", articleIds)
    .eq("status", "completed");

  // Fetch all format outputs for these articles
  const { data: formatOutputs } = await supabase
    .from("format_outputs")
    .select("id, article_id, format_kind, slots_data, status")
    .in("article_id", articleIds)
    .order("created_at", { ascending: true });

  // Fetch video render jobs safely (graceful fallback if table is not yet migrated)
  let videoJobs: any[] = [];
  try {
    const { data: vjData, error: vjErr } = await supabase
      .from("video_render_jobs")
      .select("article_id, status, progress_pct, stage_message, created_at")
      .in("article_id", articleIds)
      .order("created_at", { ascending: false });

    if (!vjErr && vjData) {
      videoJobs = vjData;
    }
  } catch {
    // Ignored if video_render_jobs table does not exist
  }

  const digestMap = new Map<string, number>();
  for (const d of digests || []) {
    digestMap.set(d.article_id, Array.isArray(d.items) ? d.items.length : 0);
  }

  const formatMap = new Map<string, InboxFormatBadge[]>();
  for (const f of formatOutputs || []) {
    const list = formatMap.get(f.article_id) || [];
    const slots = (f.slots_data || {}) as Record<string, any>;
    list.push({
      id: f.id,
      formatKind: f.format_kind,
      status: f.status,
      reelIndex: typeof slots.reel_index === "number" ? slots.reel_index : undefined,
      durationSeconds: typeof slots.duration_seconds === "number" ? slots.duration_seconds : undefined,
    });
    formatMap.set(f.article_id, list);
  }

  const videoJobMap = new Map<string, VideoJobProgressInfo>();
  for (const vj of videoJobs) {
    if (!videoJobMap.has(vj.article_id)) {
      videoJobMap.set(vj.article_id, {
        status: vj.status,
        progressPct: vj.progress_pct,
        stageMessage: vj.stage_message,
      });
    }
  }

  return articles.map((a: any) => ({
    id: a.id,
    title: a.title,
    canonicalUrl: a.canonical_url,
    sourceType: a.source_type || "article",
    mediaMetadata: a.media_metadata as Record<string, unknown> | null,
    publishedAt: a.published_at,
    createdAt: a.created_at,
    status: a.status,
    digestItemsCount: digestMap.get(a.id) || 0,
    formats: formatMap.get(a.id) || [],
    videoJob: videoJobMap.get(a.id) || null,
  }));
}
