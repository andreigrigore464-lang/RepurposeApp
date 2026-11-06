/**
 * One-Time Repurpose Studio Page
 * Unified workspace for ad-hoc article and video repurposing with live job tracking.
 * System Layer: ui / repurpose
 */

import { getCurrentContext } from "@/lib/current-context";
import { getWorkflowSettings, getUserTemplates, getBrandKitByBrandId } from "@/db/queries-brand-kit";
import { RepurposeStudio } from "@/components/repurpose/repurpose-studio";

export const dynamic = "force-dynamic";

export default async function RepurposePage() {
  const { brandId } = await getCurrentContext();
  const [workflowSettings, templates, brandKit] = await Promise.all([
    getWorkflowSettings(brandId),
    getUserTemplates(brandId),
    getBrandKitByBrandId(brandId),
  ]);

  return (
    <RepurposeStudio
      workflows={workflowSettings.workflows || []}
      templates={templates}
      brandKit={brandKit}
    />
  );
}

