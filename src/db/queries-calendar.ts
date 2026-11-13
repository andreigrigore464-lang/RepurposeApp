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
    const { error: updateError } = await supabase
      .from("format_outputs")
      .update({
        status: "scheduled",
        scheduled_at: item.scheduledAt,
        scheduled_has_time: item.hasTime ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.formatOutputId)
      .eq("brand_id", brandId);

    if (updateError && updateError.message.includes("does not exist")) {
      // Fallback: update slots_data for unmigrated database
      const { data: existing } = await supabase
        .from("format_outputs")
        .select("slots_data")
        .eq("id", item.formatOutputId)
        .eq("brand_id", brandId)
        .single();

      const currentSlots = (existing?.slots_data || {}) as Record<string, unknown>;
      const updatedSlots = {
        ...currentSlots,
        scheduled_at: item.scheduledAt,
        scheduled_has_time: item.hasTime ?? false,
      };

      await supabase
        .from("format_outputs")
        .update({
          status: "scheduled",
          slots_data: updatedSlots,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.formatOutputId)
        .eq("brand_id", brandId);
    } else if (updateError) {
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
  const { error: updateError } = await supabase
    .from("format_outputs")
    .update({
      status: "draft",
      scheduled_at: null,
      scheduled_has_time: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", formatOutputId)
    .eq("brand_id", brandId);

  if (updateError && updateError.message.includes("does not exist")) {
    const { data: existing } = await supabase
      .from("format_outputs")
      .select("slots_data")
      .eq("id", formatOutputId)
      .eq("brand_id", brandId)
      .single();

    const currentSlots = (existing?.slots_data || {}) as Record<string, unknown>;
    delete currentSlots.scheduled_at;
    delete currentSlots.scheduled_has_time;

    await supabase
      .from("format_outputs")
      .update({
        status: "draft",
        slots_data: currentSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", formatOutputId)
      .eq("brand_id", brandId);
  } else if (updateError) {
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
  const { error: updateError } = await supabase
    .from("format_outputs")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", formatOutputId)
    .eq("brand_id", brandId);

  if (updateError && updateError.message.includes("does not exist")) {
    const { data: existing } = await supabase
      .from("format_outputs")
      .select("slots_data")
      .eq("id", formatOutputId)
      .eq("brand_id", brandId)
      .single();

    const currentSlots = (existing?.slots_data || {}) as Record<string, unknown>;
    const updatedSlots = {
      ...currentSlots,
      published_at: new Date().toISOString(),
    };

    await supabase
      .from("format_outputs")
      .update({
        status: "published",
        slots_data: updatedSlots,
        updated_at: new Date().toISOString(),
      })
      .eq("id", formatOutputId)
      .eq("brand_id", brandId);
  } else if (updateError) {
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
      scheduled_at,
      scheduled_has_time,
      published_at,
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

  let rawOutputs: any[] = formatOutputs || [];

  if (error) {
    if (error.message.includes("does not exist")) {
      // Graceful fallback when migration 00006 has not yet been applied to Supabase
      const fallback = await supabase
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

      if (fallback.error) {
        console.error("[calendar:db] Failed to list scheduled format outputs:", fallback.error.message);
        throw new Error(`Failed to list scheduled format outputs: ${fallback.error.message}`);
      }
      rawOutputs = fallback.data || [];
    } else {
      console.error("[calendar:db] Failed to list scheduled format outputs:", error.message);
      throw new Error(`Failed to list scheduled format outputs: ${error.message}`);
    }
  }

  if (!rawOutputs || rawOutputs.length === 0) {
    return [];
  }

  // Fetch variants for all returned format outputs
  const formatIds = rawOutputs.map((f: any) => f.id);
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

  return rawOutputs.map((item: any) => {
    const scheduledAt = item.scheduled_at || item.slots_data?.scheduled_at;
    const scheduledHasTime = item.scheduled_has_time ?? item.slots_data?.scheduled_has_time ?? false;
    const publishedAt = item.published_at || item.slots_data?.published_at;

    return {
      id: item.id,
      article_id: item.article_id,
      brand_id: item.brand_id,
      format_kind: item.format_kind,
      status: item.status,
      scheduled_at: scheduledAt,
      scheduled_has_time: scheduledHasTime,
      published_at: publishedAt,
      slots_data: {
        ...(item.slots_data || {}),
        scheduled_at: scheduledAt,
        scheduled_has_time: scheduledHasTime,
        published_at: publishedAt,
      },
      created_at: item.created_at,
      updated_at: item.updated_at,
      article: item.articles,
      variants: variantsMap.get(item.id) || [],
    };
  });
}

/**
 * Get the brand's auto-posting trust vote
 */
export async function getAutoPostTrustVote(
  brandId: string
): Promise<AutoPostTrustVote | null> {
  const { data, error } = await supabase
    .from("trust_votes")
    .select("vote, voted_at")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (error || !data) {
    // Fallback to legacy brand_kits if table does not yet have record
    const custom = await getBrandTemplates(brandId);
    if (custom.autoPostTrustVote && custom.autoPostTrustVote.vote) {
      return custom.autoPostTrustVote as AutoPostTrustVote;
    }
    return null;
  }

  return {
    vote: data.vote as "yes" | "no",
    votedAt: data.voted_at,
  };
}

/**
 * Save the brand's auto-posting trust vote
 */
export async function saveAutoPostTrustVote(
  brandId: string,
  vote: "yes" | "no"
): Promise<boolean> {
  const { error } = await supabase
    .from("trust_votes")
    .upsert(
      {
        brand_id: brandId,
        vote,
        voted_at: new Date().toISOString(),
      },
      { onConflict: "brand_id" }
    );

  if (error) {
    console.error(`[calendar:db] Failed to save trust vote for brand ${brandId}:`, error.message);
    // Graceful fallback to brand_kits if table is not yet migrated
    const current = await getBrandTemplates(brandId);
    return updateBrandTemplates(brandId, {
      ...current,
      autoPostTrustVote: {
        vote,
        votedAt: new Date().toISOString(),
      },
    });
  }

  return true;
}

