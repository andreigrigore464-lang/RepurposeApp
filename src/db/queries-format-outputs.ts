/**
 * Format Outputs Database Queries
 * Query operations for inserting, retrieving, and listing format outputs in Supabase.
 * Database Layer
 */

import { supabase } from "./client";

export interface FormatOutputRecord {
  id: string;
  article_id: string;
  digest_id?: string | null;
  brand_id: string;
  format_kind: string;
  slots_data: Record<string, unknown>;
  referenced_item_ids: string[];
  status: "draft" | "reviewed" | "scheduled" | "published" | "exported" | "failed";
  created_at: string;
  updated_at: string;
}

export async function insertFormatOutput(params: {
  articleId: string;
  digestId?: string | null;
  brandId: string;
  formatKind: string;
  slotsData: Record<string, unknown>;
  referencedItemIds: string[];
  status?: "draft" | "reviewed" | "scheduled" | "published" | "exported" | "failed";
}): Promise<FormatOutputRecord> {
  const { data, error } = await supabase
    .from("format_outputs")
    .insert({
      article_id: params.articleId,
      digest_id: params.digestId || null,
      brand_id: params.brandId,
      format_kind: params.formatKind,
      slots_data: params.slotsData,
      referenced_item_ids: params.referencedItemIds,
      status: params.status || "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to insert format_output for article "${params.articleId}" and format "${params.formatKind}": ${error.message}`
    );
  }

  return data as FormatOutputRecord;
}

export async function listFormatOutputsForArticle(articleId: string): Promise<FormatOutputRecord[]> {
  const { data, error } = await supabase
    .from("format_outputs")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list format_outputs for article "${articleId}": ${error.message}`);
  }

  return (data || []) as FormatOutputRecord[];
}

export async function getFormatOutputById(formatOutputId: string): Promise<FormatOutputRecord | null> {
  const { data, error } = await supabase
    .from("format_outputs")
    .select("*")
    .eq("id", formatOutputId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get format_output "${formatOutputId}": ${error.message}`);
  }

  return data as FormatOutputRecord | null;
}

export async function deleteFormatOutputById(formatOutputId: string, brandId: string): Promise<boolean> {
  const { error } = await supabase
    .from("format_outputs")
    .delete()
    .eq("id", formatOutputId)
    .eq("brand_id", brandId);

  if (error) {
    console.error(`[db] Failed to delete format_output "${formatOutputId}":`, error.message);
    throw new Error(`Failed to delete format output: ${error.message}`);
  }

  return true;
}

