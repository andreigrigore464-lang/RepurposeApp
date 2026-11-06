/**
 * Waitlist Database Queries
 * Manages email submissions and subscriber records for the public waitlist.
 * System Layer: db
 */

import { supabase } from "./client";

export interface WaitlistRecord {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function insertWaitlistEntry(params: {
  email: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{ record: WaitlistRecord | null; isExisting: boolean }> {
  // Normalize email
  const normalizedEmail = params.email.trim().toLowerCase();

  // Check if email already exists
  const { data: existing } = await supabase
    .from("waitlist")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return { record: existing as WaitlistRecord, isExisting: true };
  }

  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      email: normalizedEmail,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert waitlist entry: ${error.message}`);
  }

  return { record: data as WaitlistRecord, isExisting: false };
}

export async function getWaitlistCount(): Promise<number> {
  const { count, error } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("[db] Failed to fetch waitlist count:", error.message);
    return 0;
  }

  return count || 0;
}

