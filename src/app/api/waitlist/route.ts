/**
 * Waitlist API Route Handler
 * Endpoint for public waitlist submissions with validation and bot honeypot protection.
 * System Layer: api / waitlist
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { insertWaitlistEntry } from "@/db/queries-waitlist";

const WaitlistSubmissionSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  honeypot: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = WaitlistSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid email address." },
        { status: 400 }
      );
    }

    // Bot honeypot check: If the hidden honeypot field has content, silently discard
    if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true, message: "Subscribed." });
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    const result = await insertWaitlistEntry({
      email: parsed.data.email,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({
      success: true,
      isExisting: result.isExisting,
      message: result.isExisting
        ? "You are already on the priority list!"
        : "You're on the list. We'll be in touch soon.",
    });
  } catch (err: any) {
    console.error("[waitlist] Submission error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to join waitlist. Please try again." },
      { status: 500 }
    );
  }
}

