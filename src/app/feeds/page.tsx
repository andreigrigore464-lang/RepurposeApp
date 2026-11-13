/**
 * Publishing Workflows Page
 * Interface for configuring automated pipelines, template bindings, publication feeds, and single draft ingest.
 * System Layer: ui / feeds
 */

import { getCurrentContext } from "@/lib/current-context";
import { listFeedsForBrand } from "@/db/queries-feeds";
import { getWorkflowSettings, getUserTemplates } from "@/db/queries-brand-kit";
import { FeedsManager } from "@/components/feeds/feeds-manager";

export const dynamic = "force-dynamic";

export default async function FeedsPage() {
  const { brandId } = await getCurrentContext();
  const [feeds, workflowSettings, templates] = await Promise.all([
    listFeedsForBrand(brandId),
    getWorkflowSettings(brandId),
    getUserTemplates(brandId),
  ]);

  return (
    <FeedsManager
      initialWorkflows={workflowSettings.workflows || []}
      templates={templates}
      initialFeeds={feeds}
    />
  );
}
