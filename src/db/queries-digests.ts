/**
 * Digests Database Queries
 * Query operations for inserting, retrieving, and updating grounded digests in Supabase.
 * Database Layer
 */

import { supabase } from "./client";
import { DigestItem } from "../pipeline/2-digest/digest-schema";

export interface DigestRecord {
  id: string;
  article_id: string;
  brand_id: string;
  items: DigestItem[];
  status: "completed" | "failed";
  retry_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export async function insertDigest(params: {
  articleId: string;
  brandId: string;
  items: DigestItem[];
  status: "completed" | "failed";
  retryCount: number;
  errorMessage?: string;
}): Promise<DigestRecord> {
  const { data, error } = await supabase
    .from("digests")
    .insert({
      article_id: params.articleId,
      brand_id: params.brandId,
      items: params.items,
      status: params.status,
      retry_count: params.retryCount,
      error_message: params.errorMessage || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert digest for article "${params.articleId}": ${error.message}`);
  }

  // Update article status accordingly
  await supabase
    .from("articles")
    .update({
      status: params.status === "completed" ? "digested" : "failed_digest",
      error_message: params.errorMessage || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.articleId);

  return data as DigestRecord;
}

export async function getDigestByArticleId(
  articleId: string,
  status?: "completed" | "failed"
): Promise<DigestRecord | null> {
  let query = supabase
    .from("digests")
    .select("*")
    .eq("article_id", articleId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get digest for article "${articleId}": ${error.message}`);
  }

  return data as DigestRecord | null;
}

