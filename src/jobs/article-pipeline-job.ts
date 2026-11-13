/**
 * Unified Article Repurposing Pipeline Job
 * Orchestrates Digest -> Formats -> Platform Adaptation asynchronously via Inngest.
 * Enforces per-article and per-brand concurrency limits to prevent LLM TPM spikes and race conditions.
 * Jobs Layer
 */

import { inngest } from "./inngest-client";
import { runArticlePipeline, PipelineExecutionOptions } from "../pipeline/run-article-pipeline";
import { supabase } from "../db/client";

export const articlePipelineJob = inngest.createFunction(
  {
    id: "article-pipeline-job",
    name: "Article Repurposing Pipeline",
    retries: 2,
    concurrency: [
      { key: "event.data.articleId", limit: 1 },
      { key: "event.data.brandId", limit: 2 },
    ],
  },
  { event: "app/article.pipeline" },
  async ({ event, step }) => {
    const { articleId, options } = event.data as {
      articleId: string;
      brandId?: string;
      options?: PipelineExecutionOptions;
    };

    console.log(`[inngest:pipeline] Received job for article=${articleId}`);

    try {
      const result = await step.run("execute-pipeline", async () => {
        return await runArticlePipeline(articleId, options);
      });

      console.log(
        `[inngest:pipeline] Finished job for article=${articleId} success=${result.success} formats=${result.formatsCount}`
      );

      return result;
    } catch (err: any) {
      console.error(`[inngest:pipeline] Job failed for article=${articleId}:`, err);

      // Explicitly mark article status as failed in database so UI immediately surfaces the retry badge
      await supabase
        .from("articles")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
          updated_at: new Date().toISOString(),
        })
        .eq("id", articleId);

      throw err;
    }
  }
);

