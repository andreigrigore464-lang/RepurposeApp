/**
 * Format Outputs API Route
 * Handles operations on generated format outputs, including individual output deletion.
 * System Layer: api
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentContext } from "@/lib/current-context";
import { deleteFormatOutputById } from "@/db/queries-format-outputs";

const DeleteFormatOutputSchema = z.object({
  id: z.string().uuid("Invalid format output ID"),
});

export async function DELETE(req: Request) {
  try {
    const { brandId } = await getCurrentContext();

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

    const parsed = DeleteFormatOutputSchema.safeParse({ id: targetId });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid format output ID", details: parsed.error.issues },
        { status: 400 }
      );
    }

    console.log(`[format-outputs] Deleting format_output=${parsed.data.id} brand=${brandId}`);
    await deleteFormatOutputById(parsed.data.id, brandId);

    return NextResponse.json({ success: true, deletedId: parsed.data.id });
  } catch (err: any) {
    console.error("[format-outputs] Delete error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

