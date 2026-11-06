/**
 * User Templates API Route
 * Handles retrieving and saving individual user templates and active generation flags.
 * System Layer: api / templates
 */

import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { getUserTemplates, saveUserTemplates, upsertBrandKit } from "@/db/queries-brand-kit";

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const templates = await getUserTemplates(brandId);
    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();

    if (!body || !Array.isArray(body.templates)) {
      return NextResponse.json(
        { error: "Expected 'templates' array in request body." },
        { status: 400 }
      );
    }

    // Save templates
    console.log(`[templates] Saving ${body.templates.length} templates for brand=${brandId}`);
    await saveUserTemplates(brandId, body.templates);

    // If brand style updates were provided alongside the template, update brand_kit
    if (body.brandKitUpdates) {
      await upsertBrandKit(brandId, body.brandKitUpdates);
    }

    return NextResponse.json({ success: true, count: body.templates.length });
  } catch (err: any) {
    console.error("[templates] Save error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

