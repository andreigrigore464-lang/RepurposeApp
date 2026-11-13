/**
 * Article Pipeline Dispatcher
 * Decouples HTTP request handlers from LLM execution by queuing jobs to Inngest.
 * Provides transparent fallback for local script/offline development.
 * Jobs Layer
 */

import { inngest } from "./inngest-client";
import { runArticlePipeline, PipelineExecutionOptions } from "../pipeline/run-article-pipeline";

export interface DispatchPipelineParams {
  articleId: string;
  brandId?: string;
  options?: PipelineExecutionOptions;
}

export interface DispatchResult {
  dispatched: boolean;
  mode: "inngest" | "sync";
  error?: string;
}

export async function dispatchArticlePipeline(
  params: DispatchPipelineParams
): Promise<DispatchResult> {
  const isSyncMode = process.env.INNGEST_DEV_SYNC === "true";

  if (!isSyncMode) {
    try {
      await inngest.send({
        name: "app/article.pipeline",
        data: {
          articleId: params.articleId,
          brandId: params.brandId,
          options: params.options,
        },
      });

      console.log(`[pipeline:dispatch] article=${params.articleId} queued_to=inngest`);
      return { dispatched: true, mode: "inngest" };
    } catch (err: any) {
      console.warn(
        `[pipeline:dispatch] article=${params.articleId} inngest_offline="${err.message}", falling back to background execution`
      );

      // In local dev without Inngest running, invoke asynchronously without awaiting in HTTP thread
      runArticlePipeline(params.articleId, params.options).catch((bgErr) => {
        console.error(
          `[pipeline:dispatch] Background fallback execution failed for article=${params.articleId}:`,
          bgErr
        );
      });

      return { dispatched: true, mode: "sync" };
    }
  }

  // Explicit synchronous testing mode
  console.log(`[pipeline:dispatch] article=${params.articleId} running_sync (INNGEST_DEV_SYNC)`);
  runArticlePipeline(params.articleId, params.options).catch((syncErr) => {
    console.error(
      `[pipeline:dispatch] Inline execution failed for article=${params.articleId}:`,
      syncErr
    );
  });

  return { dispatched: true, mode: "sync" };
}

