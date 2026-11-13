/**
 * Templates Dashboard Page
 * Lists all custom master templates and serves as the single entry point for visual post customization.
 * System Layer: ui / templates
 */

import { getCurrentContext } from "@/lib/current-context";
import { getBrandKitByBrandId, getUserTemplates } from "@/db/queries-brand-kit";
import { getDefaultTemplate } from "@/render/load-brand-template";
import { TemplatesManager } from "@/components/templates/templates-manager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const { brandId } = await getCurrentContext();
  const [brandKit, templates] = await Promise.all([
    getBrandKitByBrandId(brandId),
    getUserTemplates(brandId),
  ]);

  const defaultCardTemplate = getDefaultTemplate("card");
  const defaultCarouselTemplate = getDefaultTemplate("carousel");
  const defaultVideoReelTemplate = getDefaultTemplate("video-reel");

  return (
    <div className="space-y-6">
      <TemplatesManager
        initialTemplates={templates}
        brandKit={brandKit}
        defaultCardTemplate={defaultCardTemplate}
        defaultCarouselTemplate={defaultCarouselTemplate}
        defaultVideoReelTemplate={defaultVideoReelTemplate}
      />
    </div>
  );
}

