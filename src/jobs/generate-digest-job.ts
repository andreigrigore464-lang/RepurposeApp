/**
 * Grounded Digest Background Job
 * Background job triggered when a new article is ingested to run the LLM grounded digest extraction.
 * Jobs Layer
 */

import { inngest } from "./inngest-client";
import { generateGroundedDigest } from "../pipeline/2-digest/generate-digest";

export const generateDigestJob = inngest.createFunction(
  {
    id: "generate-grounded-digest",
    name: "Generate Grounded Digest",
    retries: 2,
  },
  { event: "app/article.ingested" },
  async ({ event, step }) => {
    const { articleId, brandId, title, cleanText, voiceGuidelines } = event.data;

    const result = await step.run("extract-grounded-digest", async () => {
      return await generateGroundedDigest({
        articleId,
        brandId,
        articleTitle: title,
        articleText: cleanText,
        brandVoiceGuidelines: voiceGuidelines,
      });
    });

    return {
      articleId,
      digestId: result.digestRecord.id,
      status: result.digestRecord.status,
      itemCount: result.digestRecord.items.length,
      retriesUsed: result.retriesUsed,
    };
  }
);

