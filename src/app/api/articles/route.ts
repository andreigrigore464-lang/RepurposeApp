/**
 * Articles API Route
 * Handles operations on ingested articles, including article deletion.
 * System Layer: api
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentContext } from "@/lib/current-context";
import { deleteArticleById } from "@/db/queries-articles";
import { getInboxArticlesForBrand } from "@/db/queries-inbox";

const DeleteArticleSchema = z.object({
  id: z.string().uuid("Invalid article ID"),
});

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const articles = await getInboxArticlesForBrand(brandId);
    return NextResponse.json({ articles });
  } catch (err: any) {
    console.error("[articles] Fetch error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { brandId } = await getCurrentContext();

    // Support both query param (?id=...) and JSON body ({ id })
    const url = new URL(req.url);
    const idFromQuery = url.searchParams.get("id");
    let targetId = idFromQuery;

    if (!targetId) {
      try {
        const body = await req.json();
        targetId = body.id;
      } catch {
        // Body might be empty
      }
    }

    const parsed = DeleteArticleSchema.safeParse({ id: targetId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid article ID", details: parsed.error.issues },
        { status: 400 }
      );
    }

    console.log(`[articles] Deleting article=${parsed.data.id} brand=${brandId}`);
    await deleteArticleById(parsed.data.id, brandId);

    return NextResponse.json({ success: true, deletedId: parsed.data.id });
  } catch (err: any) {
    console.error("[articles] Delete error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

