/**
 * Format Generation Background Job
 * Background job triggered when a grounded digest is completed to generate all allowed formats.
 * Jobs Layer
 */

import { inngest } from "./inngest-client";
import { generateAllFormatsForArticle } from "../pipeline/3-format/generate-all-formats";

export const generateFormatsJob = inngest.createFunction(
  {
    id: "generate-formats",
    name: "Generate All Formats",
    retries: 2,
  },
  { event: "app/digest.completed" },
  async ({ event, step }) => {
    const { articleId, digestId, brandId, title, items, inputSource, voiceGuidelines } = event.data;

    const formats = await step.run("synthesize-formats", async () => {
      return await generateAllFormatsForArticle({
        articleId,
        digestId,
        brandId,
        articleTitle: title,
        digestItems: items,
        inputSource,
        brandVoiceGuidelines: voiceGuidelines,
      });
    });

    return {
      articleId,
      digestId,
      formatCount: formats.length,
      formats: formats.map((f) => ({ id: f.id, kind: f.format_kind })),
    };
  }
);

