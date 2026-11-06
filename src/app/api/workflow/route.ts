/**
 * Publishing Workflows API Route
 * Handles CRUD operations for first-class user workflows, feed bindings, and template assignments.
 * System Layer: api / workflow
 */

import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import {
  getWorkflowSettings,
  saveWorkflowSettings,
  upsertWorkflow,
  deleteWorkflowById,
  getUserTemplates,
  WorkflowRecord,
} from "@/db/queries-brand-kit";
import { listFeedsForBrand, insertFeed } from "@/db/queries-feeds";

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const settings = await getWorkflowSettings(brandId);
    const templates = await getUserTemplates(brandId);
    const feeds = await listFeedsForBrand(brandId);

    return NextResponse.json({
      success: true,
      workflows: settings.workflows || [],
      templates,
      feeds,
    });
  } catch (err: any) {
    console.error("[workflow:get] Failed to fetch workflows:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to load workflows" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();

    // Batch update of workflows array
    if (Array.isArray(body.workflows)) {
      await saveWorkflowSettings(brandId, { workflows: body.workflows });
      return NextResponse.json({
        success: true,
        workflows: body.workflows,
      });
    }

    // Single workflow upsert
    const workflowData = (body.workflow || body) as WorkflowRecord;

    if (!workflowData || !workflowData.name) {
      return NextResponse.json(
        { error: "Workflow name is required." },
        { status: 400 }
      );
    }

    let feedId = workflowData.feedId;
    let feedTitle = workflowData.feedTitle;

    // If a feed URL is provided, link or create feed record
    if (workflowData.feedUrl && workflowData.feedUrl.trim()) {
      const cleanUrl = workflowData.feedUrl.trim();
      const existingFeeds = await listFeedsForBrand(brandId);
      let matchedFeed = existingFeeds.find(
        (f) => f.feed_url.toLowerCase() === cleanUrl.toLowerCase()
      );

      if (!matchedFeed) {
        matchedFeed = await insertFeed({
          brandId,
          feedUrl: cleanUrl,
          title: workflowData.name,
        });
      }

      feedId = matchedFeed.id;
      feedTitle = matchedFeed.title || workflowData.name;
    }

    const workflowRecord: WorkflowRecord = {
      id: workflowData.id || `wf-${Date.now()}`,
      name: workflowData.name.trim(),
      isActive: workflowData.isActive ?? true,
      feedId,
      feedUrl: workflowData.feedUrl?.trim() || undefined,
      feedTitle,
      pollIntervalMinutes: workflowData.pollIntervalMinutes || 60,
      enabledFormats:
        workflowData.enabledFormats && workflowData.enabledFormats.length > 0
          ? workflowData.enabledFormats
          : ["text-post", "thread", "card", "carousel"],
      cardTemplateId: workflowData.cardTemplateId,
      carouselTemplateId: workflowData.carouselTemplateId,
      createdAt: workflowData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextWorkflows = await upsertWorkflow(brandId, workflowRecord);

    return NextResponse.json({
      success: true,
      workflow: workflowRecord,
      workflows: nextWorkflows,
    });
  } catch (err: any) {
    console.error("[workflow:post] Failed to save workflow:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to save workflow" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("id");

    if (!workflowId) {
      return NextResponse.json(
        { error: "Query parameter 'id' is required to delete a workflow." },
        { status: 400 }
      );
    }

    const nextWorkflows = await deleteWorkflowById(brandId, workflowId);

    return NextResponse.json({
      success: true,
      workflows: nextWorkflows,
    });
  } catch (err: any) {
    console.error("[workflow:delete] Failed to delete workflow:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to delete workflow" },
      { status: 500 }
    );
  }
}
