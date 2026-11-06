/**
 * Calendar & Scheduling Database Queries
 * Query operations for scheduling format outputs, tracking publication, and storing auto-posting trust votes.
 * Database Layer
 */

import { supabase } from "./client";
import { FormatOutputRecord } from "./queries-format-outputs";
import { ArticleRecord } from "./queries-articles";
import { PlatformVariantRecord } from "./queries-platform-variants";
import { getBrandTemplates, updateBrandTemplates } from "./queries-brand-kit";

export interface ScheduledOutputItem {
  id: string;
  article_id: string;
  brand_id: string;
  format_kind: string;
  status: "scheduled" | "published" | "draft" | "reviewed" | "exported" | "failed";
  slots_data: Record<string, unknown> & {
    scheduled_at?: string;
    scheduled_has_time?: boolean;
    published_at?: string;
  };
  created_at: string;
  updated_at: string;
  article?: {
    id: string;
    title: string;
    canonical_url?: string;
    in_article_images?: string[];
  };
  variants?: PlatformVariantRecord[];
}

export interface ScheduleOutputPayload {
  formatOutputId: string;
  scheduledAt: string; // YYYY-MM-DD or ISO string
  hasTime?: boolean;
}

export interface AutoPostTrustVote {
  vote: "yes" | "no";
  votedAt: string;
}

/**
 * Schedule one or multiple format outputs with date/time metadata
 */
export async function scheduleFormatOutputs(
  brandId: string,
  items: ScheduleOutputPayload[]
): Promise<boolean> {
  for (const item of items) {
    // 1. Fetch current slots_data
    const { data: existing, error: fetchError } = await supabase
      .from("format_outputs")
      .select("slots_data")
      .eq("id", item.formatOutputId)
      .eq("brand_id", brandId)
      .single();

    if (fetchError) {
      console.error(`[calendar:db] Failed to fetch format_output ${item.formatOutputId}:`, fetchError.message);
      continue;
    }

    const currentSlots = (existing?.slots_data || {}) as Record<string, unknown>;
    const updatedSlots = {
      ...currentSlots,
      scheduled_at: item.scheduledAt,
      scheduled_has_time: item.hasTime ?? false,
    };

    const { error: updateError } = await supabase
      .from("format_outputs")
      .update({
        status: "scheduled",
        slots_data: updatedSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.formatOutputId)
      .eq("brand_id", brandId);

    if (updateError) {
      console.error(`[calendar:db] Failed to schedule format_output ${item.formatOutputId}:`, updateError.message);
      throw new Error(`Failed to schedule format output: ${updateError.message}`);
    }
  }

  return true;
}

/**
 * Revert a format output from scheduled back to draft
 */
export async function unscheduleFormatOutput(
  brandId: string,
  formatOutputId: string
): Promise<boolean> {
  const { data: existing, error: fetchError } = await supabase
    .from("format_outputs")
    .select("slots_data")
    .eq("id", formatOutputId)
    .eq("brand_id", brandId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch format output: ${fetchError.message}`);
  }

  const currentSlots = (existing?.slots_data || {}) as Record<string, unknown>;
  delete currentSlots.scheduled_at;
  delete currentSlots.scheduled_has_time;

  const { error: updateError } = await supabase
    .from("format_outputs")
    .update({
      status: "draft",
      slots_data: currentSlots,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formatOutputId)
    .eq("brand_id", brandId);

  if (updateError) {
    throw new Error(`Failed to unschedule format output: ${updateError.message}`);
  }

  return true;
}

/**
 * Mark a format output as published
 */
export async function markFormatOutputPublished(
  brandId: string,
  formatOutputId: string
): Promise<boolean> {
  const { data: existing, error: fetchError } = await supabase
    .from("format_outputs")
    .select("slots_data")
    .eq("id", formatOutputId)
    .eq("brand_id", brandId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch format output: ${fetchError.message}`);
  }

  const currentSlots = (existing?.slots_data || {}) as Record<string, unknown>;
  const updatedSlots = {
    ...currentSlots,
    published_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("format_outputs")
    .update({
      status: "published",
      slots_data: updatedSlots,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formatOutputId)
    .eq("brand_id", brandId);

  if (updateError) {
    throw new Error(`Failed to mark format output as published: ${updateError.message}`);
  }

  return true;
}

/**
 * List all scheduled and published format outputs for a brand with their parent article and variants
 */
export async function listScheduledOutputsForBrand(
  brandId: string
): Promise<ScheduledOutputItem[]> {
  const { data: formatOutputs, error } = await supabase
    .from("format_outputs")
    .select(`
      id,
      article_id,
      brand_id,
      format_kind,
      slots_data,
      status,
      created_at,
      updated_at,
      articles (
        id,
        title,
        canonical_url,
        in_article_images
      )
    `)
    .eq("brand_id", brandId)
    .in("status", ["scheduled", "published"])
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[calendar:db] Failed to list scheduled format outputs:", error.message);
    throw new Error(`Failed to list scheduled format outputs: ${error.message}`);
  }

  if (!formatOutputs || formatOutputs.length === 0) {
    return [];
  }

  // Fetch variants for all returned format outputs
  const formatIds = formatOutputs.map((f: any) => f.id);
  const { data: variants } = await supabase
    .from("platform_variants")
    .select("*")
    .in("format_output_id", formatIds);

  const variantsMap = new Map<string, PlatformVariantRecord[]>();
  for (const v of variants || []) {
    const list = variantsMap.get(v.format_output_id) || [];
    list.push(v as PlatformVariantRecord);
    variantsMap.set(v.format_output_id, list);
  }

  return formatOutputs.map((item: any) => ({
    id: item.id,
    article_id: item.article_id,
    brand_id: item.brand_id,
    format_kind: item.format_kind,
    status: item.status,
    slots_data: item.slots_data || {},
    created_at: item.created_at,
    updated_at: item.updated_at,
    article: item.articles,
    variants: variantsMap.get(item.id) || [],
  }));
}

/**
 * Get the brand's auto-posting trust vote
 */
export async function getAutoPostTrustVote(
  brandId: string
): Promise<AutoPostTrustVote | null> {
  const custom = await getBrandTemplates(brandId);
  if (custom.autoPostTrustVote && custom.autoPostTrustVote.vote) {
    return custom.autoPostTrustVote as AutoPostTrustVote;
  }
  return null;
}

/**
 * Save the brand's auto-posting trust vote
 */
export async function saveAutoPostTrustVote(
  brandId: string,
  vote: "yes" | "no"
): Promise<boolean> {
  const current = await getBrandTemplates(brandId);
  const autoPostTrustVote: AutoPostTrustVote = {
    vote,
    votedAt: new Date().toISOString(),
  };

  return updateBrandTemplates(brandId, {
    ...current,
    autoPostTrustVote,
  });
}

