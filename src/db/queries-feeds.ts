/**
 * Feeds Database Queries
 * Query operations for creating, listing, and updating RSS feeds in Supabase.
 * Database Layer
 */

import { supabase } from "./client";

export interface FeedRecord {
  id: string;
  brand_id: string;
  feed_url: string;
  title: string | null;
  last_polled_at: string | null;
  poll_interval_minutes: number;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export async function insertFeed(params: {
  brandId: string;
  feedUrl: string;
  title?: string;
}): Promise<FeedRecord> {
  const { data, error } = await supabase
    .from("feeds")
    .insert({
      brand_id: params.brandId,
      feed_url: params.feedUrl,
      title: params.title || null,
      verification_status: "unverified",
      last_polled_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to insert feed "${params.feedUrl}": ${error.message}`);
  }

  return data as FeedRecord;
}

export async function listFeedsForBrand(brandId: string): Promise<FeedRecord[]> {
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("brand_id", brandId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list feeds for brand "${brandId}": ${error.message}`);
  }

  return (data || []) as FeedRecord[];
}

export async function updateFeedLastPolled(feedId: string): Promise<void> {
  const { error } = await supabase
    .from("feeds")
    .update({
      last_polled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", feedId);

  if (error) {
    throw new Error(`Failed to update last_polled_at for feed "${feedId}": ${error.message}`);
  }
}

export async function getFeedById(feedId: string): Promise<FeedRecord | null> {
  const { data, error } = await supabase
    .from("feeds")
    .select("*")
    .eq("id", feedId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch feed "${feedId}": ${error.message}`);
  }

  return data as FeedRecord | null;
}

export async function deleteFeed(feedId: string, brandId: string): Promise<void> {
  const { error } = await supabase
    .from("feeds")
    .delete()
    .eq("id", feedId)
    .eq("brand_id", brandId);

  if (error) {
    throw new Error(`Failed to delete feed "${feedId}": ${error.message}`);
  }
}

