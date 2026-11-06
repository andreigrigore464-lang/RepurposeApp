/**
 * Brand Template Loader
 * Resolves brand-customized visual templates, falling back to default bundled templates.
 * System Layer: render
 */

import * as fs from "fs";
import * as path from "path";
import { Template, TemplateSchema } from "./template-schema";
import { getBrandTemplates } from "@/db/queries-brand-kit";

/**
 * Loads default template from disk as fallback
 */
export function getDefaultTemplate(format: "card" | "carousel"): Template {
  const fileName = format === "card" ? "card-default.json" : "carousel-default.json";
  const filePath = path.resolve(process.cwd(), `src/render/templates/${fileName}`);
  const raw = fs.readFileSync(filePath, "utf8");
  return TemplateSchema.parse(JSON.parse(raw));
}

/**
 * Retrieves custom template for a brand, falling back to default if not configured.
 * Checks preferredTemplateId first, then workflow default template, then first matching user template.
 */
export async function getBrandTemplate(
  brandId: string,
  format: "card" | "carousel",
  preferredTemplateId?: string
): Promise<Template> {
  try {
    const customTemplates = await getBrandTemplates(brandId);
    const userTemplates: any[] = Array.isArray(customTemplates?.templates)
      ? customTemplates.templates
      : [];

    // 1. If preferredTemplateId provided, resolve that specific template
    if (preferredTemplateId && userTemplates.length > 0) {
      const match = userTemplates.find((t) => t.id === preferredTemplateId);
      if (match?.template) {
        const parsed = TemplateSchema.safeParse(match.template);
        if (parsed.success) return parsed.data;
      }
    }

    // 2. Check workflow configuration for assigned template for this format
    const workflowTargetId =
      format === "card"
        ? customTemplates?.workflow?.defaultWorkflow?.cardTemplateId
        : customTemplates?.workflow?.defaultWorkflow?.carouselTemplateId;

    if (workflowTargetId && userTemplates.length > 0) {
      const match = userTemplates.find((t) => t.id === workflowTargetId);
      if (match?.template) {
        const parsed = TemplateSchema.safeParse(match.template);
        if (parsed.success) return parsed.data;
      }
    }

    // 3. Fallback: First matching format in user templates
    if (userTemplates.length > 0) {
      const first = userTemplates.find((t) => t.format === format);
      if (first?.template) {
        const parsed = TemplateSchema.safeParse(first.template);
        if (parsed.success) return parsed.data;
      }
    }

    // 4. Legacy fallback
    if (customTemplates && customTemplates[format]) {
      const parsed = TemplateSchema.safeParse(customTemplates[format]);
      if (parsed.success) {
        return parsed.data;
      }
      console.warn(`[render] Custom template for brand ${brandId} (${format}) invalid, falling back.`);
    }
  } catch (err: any) {
    console.warn(`[render] Could not load custom template for brand ${brandId}: ${err.message}`);
  }

  return getDefaultTemplate(format);
}

