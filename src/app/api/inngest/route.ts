/**
 * Inngest API Route Handler
 * Serves the HTTP endpoint where the Inngest runner or local dev server
 * discovers and triggers background functions.
 */

import { serve } from "inngest/next";
import { inngest } from "@/jobs/inngest-client";
import { pollFeedsJob } from "@/jobs/poll-feeds-job";
import { generateDigestJob } from "@/jobs/generate-digest-job";
import { generateFormatsJob } from "@/jobs/generate-formats-job";
import { adaptPlatformsJob } from "@/jobs/adapt-platforms-job";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pollFeedsJob, generateDigestJob, generateFormatsJob, adaptPlatformsJob],
});

