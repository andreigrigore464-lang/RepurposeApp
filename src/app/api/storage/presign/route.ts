/**
 * Storage Presign API Route
 * Generates direct-to-R2 presigned upload URLs for user video files.
 * System Layer: api / storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/storage/video-storage";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, contentType, prefix } = body;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json({ error: "Missing required 'fileName' string." }, { status: 400 });
    }

    if (!contentType || typeof contentType !== "string") {
      return NextResponse.json({ error: "Missing required 'contentType' string." }, { status: 400 });
    }

    // Safety check: only allow video / audio uploads
    const isMedia =
      contentType.startsWith("video/") ||
      contentType.startsWith("audio/") ||
      contentType === "application/octet-stream";

    if (!isMedia) {
      return NextResponse.json(
        { error: "Invalid contentType. Only video and audio uploads are permitted." },
        { status: 400 }
      );
    }

    const result = await getPresignedUploadUrl({
      fileName,
      contentType,
      prefix: prefix || "source-videos",
      expiresInSeconds: 3600, // 1 hour upload window
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api:storage:presign] Error creating presigned URL:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to generate presigned upload URL." },
      { status: 500 }
    );
  }
}
