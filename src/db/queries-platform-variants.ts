/**
 * Platform Variants Database Queries
 * Query operations for inserting, retrieving, and listing platform variants in Supabase.
 * Database Layer
 */

import { supabase } from "./client";

export interface PlatformVariantRecord {
  id: string;
  format_output_id: string;
  platform_id: string;
  adapted_payload: Record<string, unknown>;
  is_valid: boolean;
  warnings: string[];
  created_at: string;
  updated_at: string;
}

export async function insertPlatformVariant(params: {
  formatOutputId: string;
  platformId: string;
  adaptedPayload: Record<string, unknown>;
  isValid: boolean;
  warnings: string[];
}): Promise<PlatformVariantRecord> {
  const { data, error } = await supabase
    .from("platform_variants")
    .insert({
      format_output_id: params.formatOutputId,
      platform_id: params.platformId,
      adapted_payload: params.adaptedPayload,
      is_valid: params.isValid,
      warnings: params.warnings,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Failed to insert platform_variant for format "${params.formatOutputId}" on platform "${params.platformId}": ${error.message}`
    );
  }

  return data as PlatformVariantRecord;
}

export async function listVariantsForFormat(formatOutputId: string): Promise<PlatformVariantRecord[]> {
  const { data, error } = await supabase
    .from("platform_variants")
    .select("*")
    .eq("format_output_id", formatOutputId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list platform_variants for format "${formatOutputId}": ${error.message}`);
  }

  return (data || []) as PlatformVariantRecord[];
}

