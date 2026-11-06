/**
 * Drafts Inbox Page
 * Main editorial dashboard listing all ingested articles and generated multi-platform formats.
 * System Layer: ui / inbox
 */

import { getCurrentContext } from "@/lib/current-context";
import { getInboxArticlesForBrand } from "@/db/queries-inbox";
import { InboxTable } from "@/components/inbox/inbox-table";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { brandId } = await getCurrentContext();
  const articles = await getInboxArticlesForBrand(brandId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-app-ink tracking-tight">
            Drafts & Review Inbox
          </h1>
          <p className="text-sm text-app-muted mt-1">
            Browse ingested articles, inspect factual grounding, and review platform-ready social formats.
          </p>
        </div>
      </div>

      <InboxTable articles={articles} />
    </div>
  );
}

