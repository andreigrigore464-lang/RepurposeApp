/**
 * Calendar API Route
 * Handles fetching scheduled outputs, scheduling formats (simple & advanced),
 * publishing/unscheduling, and recording the auto-posting trust vote.
 * System Layer: api / calendar
 */

import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import {
  listScheduledOutputsForBrand,
  scheduleFormatOutputs,
  unscheduleFormatOutput,
  markFormatOutputPublished,
  getAutoPostTrustVote,
  saveAutoPostTrustVote,
  ScheduleOutputPayload,
} from "@/db/queries-calendar";
import { listFormatOutputsForArticle } from "@/db/queries-format-outputs";

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const scheduledItems = await listScheduledOutputsForBrand(brandId);
    const trustVote = await getAutoPostTrustVote(brandId);

    // Calculate items due today (local date comparison YYYY-MM-DD)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const dueTodayItems = scheduledItems.filter((item) => {
      const scheduledAt = item.slots_data?.scheduled_at;
      if (!scheduledAt) return false;
      const datePart = scheduledAt.split("T")[0];
      return datePart === todayStr && item.status === "scheduled";
    });

    return NextResponse.json({
      success: true,
      items: scheduledItems,
      dueTodayCount: dueTodayItems.length,
      trustVote: {
        hasVoted: Boolean(trustVote?.vote),
        vote: trustVote?.vote || null,
        votedAt: trustVote?.votedAt || null,
      },
    });
  } catch (err: any) {
    console.error("[calendar:api:get] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to load calendar data" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();
    const action = body.action;

    // 1. Schedule action (Simple or Advanced mode)
    if (action === "schedule") {
      let scheduleItems: ScheduleOutputPayload[] = [];

      // Simple mode: articleId + scheduledDate (schedules all format outputs of the article)
      if (body.mode === "simple" && body.articleId && body.scheduledDate) {
        const articleFormats = await listFormatOutputsForArticle(body.articleId);
        scheduleItems = articleFormats.map((f) => ({
          formatOutputId: f.id,
          scheduledAt: body.scheduledDate,
          hasTime: false,
        }));
      } else if (Array.isArray(body.items)) {
        // Advanced mode: explicit array of { formatOutputId, scheduledAt, hasTime }
        scheduleItems = body.items.map((i: any) => ({
          formatOutputId: i.formatOutputId,
          scheduledAt: i.scheduledAt,
          hasTime: Boolean(i.hasTime),
        }));
      } else if (body.formatOutputId && body.scheduledAt) {
        // Single format fallback
        scheduleItems = [
          {
            formatOutputId: body.formatOutputId,
            scheduledAt: body.scheduledAt,
            hasTime: Boolean(body.hasTime),
          },
        ];
      }

      if (scheduleItems.length === 0) {
        return NextResponse.json(
          { error: "No valid items provided to schedule." },
          { status: 400 }
        );
      }

      await scheduleFormatOutputs(brandId, scheduleItems);
      return NextResponse.json({ success: true, count: scheduleItems.length });
    }

    // 2. Unschedule action
    if (action === "unschedule") {
      const { formatOutputId } = body;
      if (!formatOutputId) {
        return NextResponse.json(
          { error: "formatOutputId is required to unschedule." },
          { status: 400 }
        );
      }
      await unscheduleFormatOutput(brandId, formatOutputId);
      return NextResponse.json({ success: true });
    }

    // 3. Mark published action
    if (action === "publish") {
      const { formatOutputId } = body;
      if (!formatOutputId) {
        return NextResponse.json(
          { error: "formatOutputId is required to mark as published." },
          { status: 400 }
        );
      }
      await markFormatOutputPublished(brandId, formatOutputId);
      return NextResponse.json({ success: true });
    }

    // 4. Trust vote action
    if (action === "vote_trust") {
      const { vote } = body;
      if (vote !== "yes" && vote !== "no") {
        return NextResponse.json(
          { error: "Vote must be either 'yes' or 'no'." },
          { status: 400 }
        );
      }
      await saveAutoPostTrustVote(brandId, vote);
      return NextResponse.json({ success: true, vote });
    }

    return NextResponse.json(
      { error: `Unknown action: "${action}"` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[calendar:api:post] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to process calendar action" },
      { status: 500 }
    );
  }
}

