/**
 * Platform Adaptation Background Job
 * Background job triggered when format outputs are generated to produce all allowed platform variants.
 * Jobs Layer
 */

import { inngest } from "./inngest-client";
import { listFormatOutputsForArticle } from "../db/queries-format-outputs";
import { adaptAllFormatsToPlatforms } from "../pipeline/4-adapt/adapt-all-formats";

export const adaptPlatformsJob = inngest.createFunction(
  {
    id: "adapt-platform-variants",
    name: "Adapt Formats to Platform Variants",
    retries: 2,
  },
  { event: "app/formats.generated" },
  async ({ event, step }) => {
    const { articleId, canonicalUrl, hashtags } = event.data;

    const formats = await step.run("fetch-article-formats", async () => {
      return await listFormatOutputsForArticle(articleId);
    });

    const variants = await step.run("adapt-all-formats", async () => {
      return await adaptAllFormatsToPlatforms(formats, {
        canonicalUrl,
        brandHashtags: hashtags,
      });
    });

    return {
      articleId,
      formatCount: formats.length,
      variantCount: variants.length,
    };
  }
);

