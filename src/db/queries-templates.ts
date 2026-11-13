/**
 * Custom Templates Database Queries
 * Relational persistence for user-created visual templates, archetypes, and canvas layers.
 * Database Layer: custom_templates table
 */

import { supabase } from "./client";

export interface UserTemplateRecord {
  id: string;
  brandId?: string;
  name: string;
  format: "card" | "carousel" | "video-reel";
  isActive?: boolean;
  aspectRatio: "square" | "portrait" | "vertical";
  updatedAt: string;
  template: any;
}

function mapRowToTemplate(row: any): UserTemplateRecord {
  const aspectMap: Record<string, "square" | "portrait" | "vertical"> = {
    "1:1": "square",
    "4:5": "portrait",
    "9:16": "vertical",
    square: "square",
    portrait: "portrait",
    vertical: "vertical",
  };

  return {
    id: row.id,
    brandId: row.brand_id,
    name: row.name,
    format: row.kind as "card" | "carousel" | "video-reel",
    aspectRatio: aspectMap[row.aspect_ratio] || "square",
    updatedAt: row.updated_at,
    template: row.template_data || {},
  };
}

export async function getUserTemplates(brandId: string): Promise<UserTemplateRecord[]> {
  const { data, error } = await supabase
    .from("custom_templates")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn(`[db:templates] Error loading templates for brand ${brandId}:`, error.message);
    return [];
  }

  return (data || []).map(mapRowToTemplate);
}

export async function saveUserTemplate(
  brandId: string,
  item: UserTemplateRecord
): Promise<UserTemplateRecord> {
  const aspectMap: Record<string, string> = {
    square: "1:1",
    portrait: "4:5",
    vertical: "9:16",
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
  };

  const payload: Record<string, any> = {
    brand_id: brandId,
    name: item.name.trim(),
    kind: item.format,
    aspect_ratio: aspectMap[item.aspectRatio] || "1:1",
    template_data: item.template || {},
    updated_at: new Date().toISOString(),
  };

  const isUuid =
    item.id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.id);

  if (isUuid) {
    payload.id = item.id;
  }

  const { data, error } = await supabase
    .from("custom_templates")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error || !data) {
    console.error(`[db:templates] Failed to upsert template:`, error?.message);
    throw new Error(`Failed to save template: ${error?.message}`);
  }

  return mapRowToTemplate(data);
}

export async function saveUserTemplates(
  brandId: string,
  templates: UserTemplateRecord[]
): Promise<boolean> {
  for (const t of templates) {
    await saveUserTemplate(brandId, t);
  }
  return true;
}

export async function deleteUserTemplate(
  brandId: string,
  templateId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("custom_templates")
    .delete()
    .eq("id", templateId)
    .eq("brand_id", brandId);

  if (error) {
    console.error(`[db:templates] Failed to delete template ${templateId}:`, error.message);
    throw new Error(`Failed to delete template: ${error.message}`);
  }

  return true;
}

