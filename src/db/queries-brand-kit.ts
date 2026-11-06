
/**
 * Brand Kit Database Queries
 * Manages fetching and updating visual identity tokens and editorial guidelines.
 * System Layer: db
 */

import { supabase } from "./client";

export interface UserTemplateRecord {
  id: string;
  name: string;
  format: "card" | "carousel";
  isActive?: boolean;
  aspectRatio: "square" | "portrait";
  updatedAt: string;
  template: any;
}

export interface WorkflowRecord {
  id: string;
  name: string;
  isActive: boolean;
  feedId?: string;
  feedUrl?: string;
  feedTitle?: string;
  pollIntervalMinutes?: number;
  enabledFormats: string[];
  cardTemplateId?: string;
  carouselTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRuleConfig {
  enabledFormats: string[];
  cardTemplateId?: string;
  carouselTemplateId?: string;
}

export interface FeedWorkflowOverride {
  useCustom: boolean;
  autoDraftNew: boolean;
  enabledFormats: string[];
  cardTemplateId?: string;
  carouselTemplateId?: string;
}

export interface BrandWorkflowSettings {
  workflows: WorkflowRecord[];
  defaultWorkflow?: WorkflowRuleConfig;
  feedOverrides?: Record<string, FeedWorkflowOverride>;
}

export const DEFAULT_WORKFLOW_SETTINGS: BrandWorkflowSettings = {
  workflows: [],
};

export interface BrandKitRecord {
  id: string;
  brand_id: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_heading: string;
  font_body: string;
  logo_url: string | null;
  voice_guidelines: string | null;
  custom_templates?: {
    templates?: UserTemplateRecord[];
    workflow?: BrandWorkflowSettings;
    card?: any;
    carousel?: any;
  } | null;
  created_at: string;
  updated_at: string;
}

export async function getBrandKitByBrandId(brandId: string): Promise<BrandKitRecord | null> {
  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("brand_id", brandId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`[db] Failed to fetch brand kit for brand ${brandId}:`, error.message);
    return null;
  }

  return data;
}

export async function upsertBrandKit(
  brandId: string,
  updates: Partial<Omit<BrandKitRecord, "id" | "brand_id" | "created_at" | "updated_at">>
): Promise<BrandKitRecord> {
  const { data, error } = await supabase
    .from("brand_kits")
    .upsert(
      {
        brand_id: brandId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "brand_id" }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert brand kit for brand ${brandId}: ${error?.message}`);
  }

  return data;
}

export async function getBrandTemplates(brandId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("brand_kits")
    .select("custom_templates")
    .eq("brand_id", brandId)
    .maybeSingle();

  if (error || !data?.custom_templates) {
    return {};
  }

  return data.custom_templates as Record<string, any>;
}

export async function updateBrandTemplates(
  brandId: string,
  templates: Record<string, any>
): Promise<boolean> {
  const { error } = await supabase
    .from("brand_kits")
    .update({
      custom_templates: templates,
      updated_at: new Date().toISOString(),
    })
    .eq("brand_id", brandId);

  if (error) {
    console.error(`[db] Failed to update custom_templates for brand ${brandId}:`, error.message);
    throw new Error(`Failed to update templates: ${error.message}`);
  }

  return true;
}

export async function getUserTemplates(brandId: string): Promise<UserTemplateRecord[]> {
  const custom = await getBrandTemplates(brandId);
  if (Array.isArray(custom.templates)) {
    return custom.templates;
  }
  return [];
}

export async function saveUserTemplates(
  brandId: string,
  templates: UserTemplateRecord[]
): Promise<boolean> {
  const current = await getBrandTemplates(brandId);
  return updateBrandTemplates(brandId, {
    ...current,
    templates,
  });
}

export async function getWorkflowSettings(brandId: string): Promise<BrandWorkflowSettings> {
  const custom = await getBrandTemplates(brandId);
  if (custom.workflow && Array.isArray(custom.workflow.workflows)) {
    return {
      workflows: custom.workflow.workflows,
      defaultWorkflow: custom.workflow.defaultWorkflow,
      feedOverrides: custom.workflow.feedOverrides,
    };
  }

  // Legacy structure migration
  const workflows: WorkflowRecord[] = [];
  if (custom.workflow?.feedOverrides) {
    for (const [feedId, rawOverride] of Object.entries(custom.workflow.feedOverrides)) {
      const override = rawOverride as Partial<FeedWorkflowOverride>;
      workflows.push({
        id: `wf-${feedId}`,
        name: `Feed Workflow (${feedId.slice(0, 6)})`,
        isActive: override.useCustom ?? true,
        feedId,
        pollIntervalMinutes: 60,
        enabledFormats: override.enabledFormats || ["text-post", "thread", "card", "carousel"],
        cardTemplateId: override.cardTemplateId,
        carouselTemplateId: override.carouselTemplateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return {
    workflows,
    defaultWorkflow: custom.workflow?.defaultWorkflow,
    feedOverrides: custom.workflow?.feedOverrides,
  };
}

export async function saveWorkflowSettings(
  brandId: string,
  settings: BrandWorkflowSettings
): Promise<boolean> {
  const current = await getBrandTemplates(brandId);
  return updateBrandTemplates(brandId, {
    ...current,
    workflow: settings,
  });
}

export async function upsertWorkflow(
  brandId: string,
  workflow: WorkflowRecord
): Promise<WorkflowRecord[]> {
  const currentSettings = await getWorkflowSettings(brandId);
  const existingIdx = currentSettings.workflows.findIndex((w) => w.id === workflow.id);

  let nextWorkflows: WorkflowRecord[];
  if (existingIdx >= 0) {
    nextWorkflows = [...currentSettings.workflows];
    nextWorkflows[existingIdx] = { ...workflow, updatedAt: new Date().toISOString() };
  } else {
    nextWorkflows = [workflow, ...currentSettings.workflows];
  }

  await saveWorkflowSettings(brandId, {
    ...currentSettings,
    workflows: nextWorkflows,
  });

  return nextWorkflows;
}

export async function deleteWorkflowById(
  brandId: string,
  workflowId: string
): Promise<WorkflowRecord[]> {
  const currentSettings = await getWorkflowSettings(brandId);
  const nextWorkflows = currentSettings.workflows.filter((w) => w.id !== workflowId);

  await saveWorkflowSettings(brandId, {
    ...currentSettings,
    workflows: nextWorkflows,
  });

  return nextWorkflows;
}

