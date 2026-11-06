/**
 * Brand Kit API Route
 * Handles retrieving and saving the visual identity and voice guidelines for the current brand.
 * System Layer: api
 */

import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/current-context";
import { getBrandKitByBrandId, upsertBrandKit } from "@/db/queries-brand-kit";

export async function GET() {
  try {
    const { brandId } = await getCurrentContext();
    const brandKit = await getBrandKitByBrandId(brandId);
    return NextResponse.json({ brandKit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { brandId } = await getCurrentContext();
    const body = await req.json();

    const updated = await upsertBrandKit(brandId, {
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      background_color: body.background_color,
      text_color: body.text_color,
      font_heading: body.font_heading,
      font_body: body.font_body,
      voice_guidelines: body.voice_guidelines,
    });

    return NextResponse.json({ brandKit: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

