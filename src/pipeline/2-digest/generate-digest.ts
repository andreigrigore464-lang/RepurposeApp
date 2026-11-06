/**
 * Grounded Digest Generator
 * Invokes the LLM to extract atomic factual items strictly grounded in the article text,
 * running bounded retries on validation failure, and persisting the resulting digest state.
 * Pipeline Stage: 2-digest
 */

import { getLlmProvider, LlmProvider } from "../../llm/llm-provider";
import { ALL_DIGEST_KINDS } from "../../registries/digest-kinds/all-digest-kinds";
import { validateDigestGrounding } from "./validate-digest-grounding";
import { GroundedDigest, DigestItem } from "./digest-schema";
import { insertDigest, DigestRecord } from "../../db/queries-digests";

export interface GenerateDigestParams {
  articleId: string;
  brandId: string;
  articleTitle: string;
  articleText: string;
  brandVoiceGuidelines?: string;
  llmProvider?: LlmProvider;
  maxRetries?: number;
}

export interface GenerateDigestResult {
  digestRecord: DigestRecord;
  success: boolean;
  retriesUsed: number;
}

function buildSystemInstruction(): string {
  const kindsList = ALL_DIGEST_KINDS.map(
    (k) => `- "${k.id}": ${k.name} — ${k.description} (Guidance: ${k.extractionPromptGuidance})`
  ).join("\n");

  return `You are an expert editorial research assistant performing strictly grounded fact extraction.
Your task is to extract between 5 and 12 distinct, high-value atomic factual items from the provided article text.

Every item MUST belong to one of these registered kinds:
${kindsList}

NON-NEGOTIABLE ANTI-HALLUCINATION RULES:
1. Every item MUST have a "source_sentences" array containing 1 or more VERBATIM sentences copied directly from the article text.
2. DO NOT paraphrase the source sentences. They must match the article text word-for-word.
3. DO NOT introduce external knowledge, facts, dates, names, or quotes not present in the article text.
4. The "text" field should be a clean, clear distillation of the claim or takeaway grounded in those source sentences.
5. Return JSON with the structure:
{
  "items": [
    {
      "id": "item_1",
      "kind": "core_thesis",
      "text": "Distilled claim or takeaway",
      "source_sentences": ["Verbatim sentence copied from article."]
    }
  ]
}`;
}

export async function generateGroundedDigest(
  params: GenerateDigestParams
): Promise<GenerateDigestResult> {
  const llm = params.llmProvider || getLlmProvider();
  const maxRetries = params.maxRetries ?? 2;
  const systemInstruction = buildSystemInstruction();

  let retryFeedback = "";
  let lastErrors: string[] = [];
  let successfulDigest: GroundedDigest | null = null;
  let retriesUsed = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    retriesUsed = attempt;
    const prompt = `ARTICLE TITLE: "${params.articleTitle}"
${params.brandVoiceGuidelines ? `BRAND EDITORIAL GUIDELINES: "${params.brandVoiceGuidelines}"\n` : ""}
SOURCE ARTICLE TEXT:
---
${params.articleText}
---
${retryFeedback ? `\nPREVIOUS ATTEMPT FAILED WITH ERRORS:\n${retryFeedback}\nPlease fix these errors and ensure all source sentences are verbatim substrings of the article text.\n` : ""}
Extract the grounded digest items in the required JSON format.`;

    try {
      const candidate = await llm.generateJson<unknown>({
        prompt,
        systemInstruction,
        temperature: 0.1,
      });

      const validation = validateDigestGrounding(candidate, params.articleText);
      if (validation.isValid && validation.digest) {
        successfulDigest = validation.digest;
        break;
      } else {
        lastErrors = validation.errors;
        retryFeedback = validation.errors.map((e) => `- ${e}`).join("\n");
        console.warn(
          `[digest] article=${params.articleId} attempt=${attempt} status=validation_failed errors=${validation.errors.length}`
        );
      }
    } catch (err) {
      lastErrors = [err instanceof Error ? err.message : String(err)];
      retryFeedback = `LLM call failed: ${lastErrors[0]}`;
      console.warn(
        `[digest] article=${params.articleId} attempt=${attempt} status=llm_error error="${lastErrors[0]}"`
      );
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }

  if (successfulDigest) {
    const record = await insertDigest({
      articleId: params.articleId,
      brandId: params.brandId,
      items: successfulDigest.items,
      status: "completed",
      retryCount: retriesUsed,
    });

    console.log(
      `[digest] article=${params.articleId} items=${record.items.length} retries=${retriesUsed} status=success`
    );

    return {
      digestRecord: record,
      success: true,
      retriesUsed,
    };
  }

  // Failed state after exhausting bounded retries
  const failedRecord = await insertDigest({
    articleId: params.articleId,
    brandId: params.brandId,
    items: [],
    status: "failed",
    retryCount: retriesUsed,
    errorMessage: `Grounded digest extraction failed after ${retriesUsed} retries. Errors: ${lastErrors.join("; ")}`,
  });

  console.error(
    `[digest] article=${params.articleId} items=0 retries=${retriesUsed} status=failed error="${failedRecord.error_message}"`
  );

  return {
    digestRecord: failedRecord,
    success: false,
    retriesUsed,
  };
}

