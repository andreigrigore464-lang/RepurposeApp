/**
 * Brand Templates API Route
 * Handles retrieving and persisting custom declarative visual templates for the brand kit.
 * System Layer: api / brand / templates
 */

import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { getBrandTemplates, updateBrandTemplates } from "@/db/queries-brand-kit";

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const templates = await getBrandTemplates(brandId);
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();

    if (!body || typeof body.templates !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid 'templates' in request body." },
        { status: 400 }
      );
    }

    console.log(`[brand/templates] Updating custom templates for brand=${brandId}`);
    await updateBrandTemplates(brandId, body.templates);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[brand/templates] Save error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

