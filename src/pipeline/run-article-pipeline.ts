/**
 * Full Article Repurposing Pipeline Orchestrator
 * Executes the complete sequential pipeline for an article:
 * Digest (LLM) -> Formats (LLM) -> Platform Adapters (Code).
 * Pipeline Layer: orchestrator
 */

import { supabase } from "../db/client";
import { getArticleById, ArticleRecord } from "../db/queries-articles";
import { getBrandKitByBrandId, getWorkflowSettings, WorkflowRuleConfig } from "../db/queries-brand-kit";
import { getDigestByArticleId } from "../db/queries-digests";
import { generateGroundedDigest } from "./2-digest/generate-digest";
import { generateAllFormatsForArticle } from "./3-format/generate-all-formats";
import { adaptAllFormatsToPlatforms } from "./4-adapt/adapt-all-formats";
import { FormatOutputRecord } from "../db/queries-format-outputs";

export interface PipelineExecutionOptions {
  workflowConfig?: WorkflowRuleConfig;
  preferredImageUrl?: string;
}

export interface PipelineExecutionResult {
  articleId: string;
  digestId: string;
  formatsCount: number;
  variantsCount: number;
  success: boolean;
  error?: string;
}

const activePipelines = new Set<string>();

export async function runArticlePipeline(
  articleId: string,
  options?: PipelineExecutionOptions
): Promise<PipelineExecutionResult> {
  if (activePipelines.has(articleId)) {
    console.log(`[pipeline] Article ${articleId} is already running. Skipping duplicate concurrent run.`);
    return {
      articleId,
      digestId: "",
      formatsCount: 0,
      variantsCount: 0,
      success: true,
    };
  }

  activePipelines.add(articleId);

  try {
    console.log(`[pipeline] Starting full execution for article=${articleId}`);

    const article = await getArticleById(articleId);
    if (!article) {
      throw new Error(`Article "${articleId}" not found.`);
    }

    // Set article status to processing
    await supabase.from("articles").update({ status: "processing" }).eq("id", articleId);

    const brandKit = await getBrandKitByBrandId(article.brand_id);
    const voiceGuidelines = brandKit?.voice_guidelines || undefined;

    // 1. Stage 2: Grounded Digest Extraction (Reuse existing if completed)
    let digestId: string;
    let digestItems: any[];

    const existingDigest = await getDigestByArticleId(article.id, "completed");
    if (existingDigest && existingDigest.items?.length > 0) {
      console.log(`[pipeline:digest] Reusing existing completed digest id=${existingDigest.id} items=${existingDigest.items.length}`);
      digestId = existingDigest.id;
      digestItems = existingDigest.items;
    } else {
      console.log(`[pipeline:digest] Extracting grounded factual items for article=${articleId}`);
      const digestResult = await generateGroundedDigest({
        articleId: article.id,
        brandId: article.brand_id,
        articleTitle: article.title,
        articleText: article.clean_text,
        brandVoiceGuidelines: voiceGuidelines,
      });

      if (!digestResult.success) {
        console.error(`[pipeline:digest] Failed to extract valid grounded digest for article=${articleId}`);
        await supabase
          .from("articles")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", articleId);
        return {
          articleId,
          digestId: digestResult.digestRecord.id,
          formatsCount: 0,
          variantsCount: 0,
          success: false,
          error: digestResult.digestRecord.error_message || "Digest extraction failed.",
        };
      }

      digestId = digestResult.digestRecord.id;
      digestItems = digestResult.digestRecord.items;
    }

    console.log(
      `[pipeline:digest] article=${articleId} digest=${digestId} items=${digestItems.length}`
    );

    // Clean up any previous format outputs for this article before regenerating
    await supabase.from("format_outputs").delete().eq("article_id", article.id);

    // Resolve effective workflow rules & template bindings
    const workflowSettings = await getWorkflowSettings(article.brand_id);
    let effectiveConfig: WorkflowRuleConfig = {
      enabledFormats: ["text-post", "thread", "card", "carousel"],
    };

    if (options?.workflowConfig) {
      effectiveConfig = options.workflowConfig;
    } else if (article.feed_id) {
      const matchedWorkflow = workflowSettings.workflows?.find(
        (w) => w.feedId === article.feed_id && w.isActive
      );
      if (matchedWorkflow) {
        effectiveConfig = {
          enabledFormats: matchedWorkflow.enabledFormats,
          cardTemplateId: matchedWorkflow.cardTemplateId,
          carouselTemplateId: matchedWorkflow.carouselTemplateId,
        };
      } else if (workflowSettings.feedOverrides?.[article.feed_id]) {
        effectiveConfig = workflowSettings.feedOverrides[article.feed_id];
      }
    } else if (workflowSettings.workflows && workflowSettings.workflows.length > 0) {
      const firstActive = workflowSettings.workflows.find((w) => w.isActive);
      if (firstActive) {
        effectiveConfig = {
          enabledFormats: firstActive.enabledFormats,
          cardTemplateId: firstActive.cardTemplateId,
          carouselTemplateId: firstActive.carouselTemplateId,
        };
      }
    } else if (workflowSettings.defaultWorkflow) {
      effectiveConfig = workflowSettings.defaultWorkflow;
    }

    // 2. Stage 3: Multi-Format Synthesis
    console.log(`[pipeline:formats] Synthesizing formats from digest items for article=${articleId}`);
    const formatOutputs: FormatOutputRecord[] = await generateAllFormatsForArticle({
      articleId: article.id,
      digestId,
      brandId: article.brand_id,
      articleTitle: article.title,
      digestItems,
      inputSource: article.feed_id ? "rss" : "manual-url",
      brandVoiceGuidelines: voiceGuidelines,
      articleImages: article.in_article_images,
      enabledFormats: effectiveConfig.enabledFormats,
      cardTemplateId: effectiveConfig.cardTemplateId,
      carouselTemplateId: effectiveConfig.carouselTemplateId,
      preferredImageUrl: options?.preferredImageUrl,
    });

    console.log(
      `[pipeline:formats] article=${articleId} formats_generated=${formatOutputs.length}`
    );

    // 3. Stage 4: Platform Adaptation
    console.log(`[pipeline:adapt] Adapting format outputs across target platforms for article=${articleId}`);
    const variants = await adaptAllFormatsToPlatforms(formatOutputs);

    console.log(
      `[pipeline:adapt] article=${articleId} variants_generated=${variants.length}`
    );

    // 4. Update Article status: "drafted" if formats succeeded, "failed" if 0 formats generated
    const finalStatus = formatOutputs.length > 0 ? "drafted" : "failed";
    await supabase
      .from("articles")
      .update({
        status: finalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    console.log(`[pipeline] Completed pipeline for article=${articleId} with status=${finalStatus}`);

    return {
      articleId,
      digestId,
      formatsCount: formatOutputs.length,
      variantsCount: variants.length,
      success: formatOutputs.length > 0,
    };
  } catch (err: any) {
    console.error(`[pipeline] Fatal error executing pipeline for article=${articleId}:`, err);
    await supabase
      .from("articles")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", articleId);
    throw err;
  } finally {
    activePipelines.delete(articleId);
  }
}
