/**
 * Editorial Calendar Page
 * Server page loading initial scheduled outputs and trust vote status.
 * System Layer: ui / calendar
 */

import { getCurrentContext } from "@/lib/current-context";
import {
  listScheduledOutputsForBrand,
  getAutoPostTrustVote,
} from "@/db/queries-calendar";
import { CalendarWorkspace } from "@/components/calendar/calendar-workspace";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { brandId } = await getCurrentContext();

  const [scheduledItems, trustVote] = await Promise.all([
    listScheduledOutputsForBrand(brandId),
    getAutoPostTrustVote(brandId),
  ]);

  return (
    <CalendarWorkspace
      initialItems={scheduledItems}
      initialTrustVote={{
        hasVoted: Boolean(trustVote?.vote),
        vote: trustVote?.vote || null,
      }}
    />
  );
}

