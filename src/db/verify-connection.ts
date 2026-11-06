/**
 * Database Seed Verification Script
 * Queries the database using the Supabase client and current-context IDs
 * to verify that migrations and default seed rows exist and are reachable.
 */

import { supabase } from "./client";
import { DEFAULT_ACCOUNT_ID, DEFAULT_BRAND_ID } from "../lib/current-context";

async function verifySeed() {
  console.log("Checking Supabase connection and seed data...");

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
    console.log("Please add your Supabase credentials to .env.local and run the migrations in supabase/migrations/.");
    process.exit(1);
  }

  // 1. Check account
  const { data: account, error: accError } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", DEFAULT_ACCOUNT_ID)
    .single();

  if (accError) {
    console.error("Failed to query default account:", accError.message);
    process.exit(1);
  }

  // 2. Check brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("id", DEFAULT_BRAND_ID)
    .single();

  if (brandError) {
    console.error("Failed to query default brand:", brandError.message);
    process.exit(1);
  }

  // 3. Check brand kit
  const { data: brandKit, error: kitError } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("brand_id", DEFAULT_BRAND_ID)
    .single();

  if (kitError) {
    console.error("Failed to query default brand kit:", kitError.message);
    process.exit(1);
  }

  console.log("Database connection successful and seed data verified!");
  console.log("Account:", account.name, `(${account.id})`);
  console.log("Brand:", brand.name, `(${brand.id})`);
  console.log("Brand Kit:", brandKit.font_heading, "/", brandKit.font_body);
}

verifySeed().catch((err) => {
  console.error("Unexpected error during verification:", err);
  process.exit(1);
});

