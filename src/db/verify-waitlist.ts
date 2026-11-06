/**
 * Phase 9 Waitlist Verification Script
 * Validates waitlist submissions, duplicate handling, and database persistence without LLM calls.
 * System Layer: test / verification
 */

import { insertWaitlistEntry, getWaitlistCount } from "./queries-waitlist";
import { supabase } from "./client";

async function runWaitlistVerification(): Promise<void> {
  console.log("=== PHASE 9 WAITLIST VERIFICATION ===");

  const testEmail = `test-editor-${Date.now()}@chronicle.example.com`;

  // 1. Initial count
  const initialCount = await getWaitlistCount();
  console.log(`[waitlist] Current subscriber count: ${initialCount}`);

  // 2. Insert new waitlist subscriber
  console.log(`[waitlist] Inserting test submission: ${testEmail}`);
  const result1 = await insertWaitlistEntry({
    email: testEmail,
    ipAddress: "127.0.0.1",
    userAgent: "RepurposeApp-Verify/1.0",
  });

  if (!result1.record || result1.isExisting) {
    throw new Error("Expected new waitlist entry to be created successfully.");
  }
  console.log(`[waitlist] ✓ Inserted record id=${result1.record.id}`);

  // 3. Test duplicate submission handling
  console.log(`[waitlist] Submitting duplicate email: ${testEmail}`);
  const result2 = await insertWaitlistEntry({
    email: testEmail,
    ipAddress: "127.0.0.1",
  });

  if (!result2.isExisting) {
    throw new Error("Expected duplicate submission to be flagged as existing.");
  }
  console.log(`[waitlist] ✓ Correctly identified duplicate subscriber without error.`);

  // 4. Verify updated count
  const updatedCount = await getWaitlistCount();
  console.log(`[waitlist] New subscriber count: ${updatedCount}`);
  if (updatedCount !== initialCount + 1) {
    throw new Error(`Expected count to increase by 1, got initial=${initialCount}, updated=${updatedCount}`);
  }

  // 5. Clean up test record
  await supabase.from("waitlist").delete().eq("email", testEmail);
  console.log(`[waitlist] ✓ Cleaned up test record.`);

  console.log("=== ALL PHASE 9 WAITLIST CHECKS PASSED ===");
}

runWaitlistVerification().catch((err) => {
  console.error("Waitlist verification failed:", err);
  process.exit(1);
});

