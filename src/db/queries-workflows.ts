/**
 * Workflows Database Queries
 * Relational persistence for publishing workflows, feed bindings, and template configurations.
 * Database Layer: workflows table
 */

import { supabase } from "./client";

export interface WorkflowRecord {
  id: string;
  brandId?: string;
  name: string;
  isActive: boolean;
  sourceType?: "article" | "youtube";
  feedId?: string;
  feedUrl?: string;
  feedTitle?: string;
  pollIntervalMinutes?: number;
  enabledFormats: string[];
  cardTemplateId?: string;
  carouselTemplateId?: string;
  videoReelTemplateId?: string;
  targetClipsCount?: number;
  targetDuration?: "15-30" | "30-60" | "60-90";
  language?: string;
  vocabularyHint?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandWorkflowSettings {
  workflows: WorkflowRecord[];
  defaultWorkflow?: {
    enabledFormats?: string[];
    cardTemplateId?: string;
    carouselTemplateId?: string;
  };
  feedOverrides?: Record<
    string,
    {
      enabledFormats?: string[];
      cardTemplateId?: string;
      carouselTemplateId?: string;
    }
  >;
}

function mapRowToWorkflow(row: any): WorkflowRecord {
  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    isActive: row.is_active ?? true,
    feedId: row.feed_id || undefined,
    feedUrl: row.feeds?.feed_url || undefined,
    feedTitle: row.feeds?.title || undefined,
    pollIntervalMinutes: row.poll_interval_minutes || 60,
    enabledFormats: Array.isArray(row.enabled_formats)
      ? row.enabled_formats
      : ["text-post", "thread", "card", "carousel"],
    cardTemplateId: row.card_template_id || undefined,
    carouselTemplateId: row.carousel_template_id || undefined,
    videoReelTemplateId: row.video_reel_template_id || undefined,
    targetClipsCount: row.target_clips_count || 3,
    targetDuration: (row.target_duration as "15-30" | "30-60" | "60-90") || "30-60",
    language: row.language || undefined,
    vocabularyHint: row.vocabulary_hint || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorkflowsForBrand(brandId: string): Promise<WorkflowRecord[]> {
  const { data, error } = await supabase
    .from("workflows")
    .select("*, feeds(feed_url, title)")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    // If table doesn't exist yet in local development, return empty array gracefully
    console.warn(`[db:workflows] Error loading workflows for brand ${brandId}:`, error.message);
    return [];
  }

  return (data || []).map(mapRowToWorkflow);
}

export async function upsertWorkflowRecord(
  brandId: string,
  workflow: WorkflowRecord
): Promise<WorkflowRecord> {
  const rowPayload: Record<string, any> = {
    brand_id: brandId,
    name: workflow.name.trim(),
    is_active: workflow.isActive ?? true,
    feed_id: workflow.feedId || null,
    poll_interval_minutes: workflow.pollIntervalMinutes || 60,
    enabled_formats: workflow.enabledFormats || ["text-post", "thread", "card", "carousel"],
    card_template_id: workflow.cardTemplateId || null,
    carousel_template_id: workflow.carouselTemplateId || null,
    video_reel_template_id: workflow.videoReelTemplateId || null,
    target_clips_count: workflow.targetClipsCount || 3,
    target_duration: workflow.targetDuration || "30-60",
    language: workflow.language || null,
    vocabulary_hint: workflow.vocabularyHint || null,
    updated_at: new Date().toISOString(),
  };

  // Only include id if it is a valid UUID, otherwise allow DB to generate it
  const isUuid =
    workflow.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workflow.id);

  if (isUuid) {
    rowPayload.id = workflow.id;
  }

  const { data, error } = await supabase
    .from("workflows")
    .upsert(rowPayload, { onConflict: "id" })
    .select("*, feeds(feed_url, title)")
    .single();

  if (error || !data) {
    console.error(`[db:workflows] Failed to upsert workflow:`, error?.message);
    throw new Error(`Failed to save workflow: ${error?.message}`);
  }

  return mapRowToWorkflow(data);
}

export async function deleteWorkflowRecord(
  brandId: string,
  workflowId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("workflows")
    .delete()
    .eq("id", workflowId)
    .eq("brand_id", brandId);

  if (error) {
    console.error(`[db:workflows] Failed to delete workflow ${workflowId}:`, error.message);
    throw new Error(`Failed to delete workflow: ${error.message}`);
  }

  return true;
}

export async function getWorkflowSettings(brandId: string): Promise<BrandWorkflowSettings> {
  const workflows = await listWorkflowsForBrand(brandId);
  return {
    workflows,
  };
}
