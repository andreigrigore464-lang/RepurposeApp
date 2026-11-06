/**
 * Storage Verification Script
 * Validates Cloudflare R2 bucket connectivity using credentials in .env.local.
 */

import { verifyR2Connection } from "./video-storage";

async function main() {
  console.log("Checking Cloudflare R2 bucket connection...");
  const res = await verifyR2Connection();
  if (res.success) {
    console.log("✓", res.message);
  } else {
    console.error("✗", res.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Storage test crashed:", err);
  process.exit(1);
});

