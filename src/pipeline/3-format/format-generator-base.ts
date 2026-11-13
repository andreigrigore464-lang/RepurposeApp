/**
 * Format Generator Base Helper
 * Provides shared retry orchestration, provenance validation, and structured error reporting
 * across all individual format generation modules.
 * Pipeline Stage: 3-format
 */

import { z } from "zod";
import { DigestItem } from "../2-digest/digest-schema";
import { getLlmProvider, LlmProvider } from "../../llm/llm-provider";

export interface FormatGenerationContext {
  articleId: string;
  digestId: string;
  brandId: string;
  articleTitle: string;
  digestItems: DigestItem[];
  articleImages?: string[];
  brandVoiceGuidelines?: string;
  templateId?: string;
  llmProvider?: LlmProvider;
  maxRetries?: number;
}

export interface FormatGenerationResult<T> {
  slots: T;
  referencedItemIds: string[];
  retriesUsed: number;
}

/**
 * Formats digest items into a clear bulleted list with IDs and factual text for the LLM prompt.
 * Source sentences are omitted to maximize inference speed and conserve token bandwidth.
 */
export function serializeDigestForPrompt(items: DigestItem[]): string {
  return items
    .map((item) => `[ID: ${item.id}] (${item.kind})\n${item.text}`)
    .join("\n\n");
}

/**
 * Validates that all referenced item IDs exist in the provided digest items.
 */
export function validateDigestItemReferences(
  referencedIds: string[],
  validItems: DigestItem[]
): { isValid: boolean; unknownIds: string[] } {
  const validSet = new Set(validItems.map((i) => i.id));
  const unknownIds = referencedIds.filter((id) => !validSet.has(id));
  return {
    isValid: unknownIds.length === 0,
    unknownIds,
  };
}

/**
 * Executes an LLM generation call with bounded retries against a specific Zod slot schema.
 */
export async function executeFormatGeneration<T extends { source_item_ids: string[] }>(
  formatName: string,
  schema: z.ZodType<T>,
  systemInstruction: string,
  userPrompt: string,
  context: FormatGenerationContext
): Promise<FormatGenerationResult<T>> {
  const llm = context.llmProvider || getLlmProvider();
  const maxRetries = context.maxRetries ?? 3;

  let retryFeedback = "";
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const fullPrompt = `${userPrompt}
${retryFeedback ? `\nPREVIOUS ATTEMPT FAILED WITH ERRORS:\n${retryFeedback}\nPlease fix these issues and adhere strictly to the slot length limits and schema.\n` : ""}
Output pure JSON matching the required schema.`;

    try {
      const candidate = await llm.generateJson<unknown>({
        prompt: fullPrompt,
        systemInstruction,
        temperature: 0.2,
      });

      // 1. Zod schema validation
      const parsed = schema.safeParse(candidate);
      if (!parsed.success) {
        lastErrors = parsed.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`
        );
        retryFeedback = lastErrors.map((e) => `- ${e}`).join("\n");
        console.warn(
          `[format] article=${context.articleId} format=${formatName} attempt=${attempt} status=schema_invalid errors=${lastErrors.length}`
        );
        continue;
      }

      // 2. Digest reference validation
      const refCheck = validateDigestItemReferences(
        parsed.data.source_item_ids,
        context.digestItems
      );
      if (!refCheck.isValid) {
        lastErrors = [
          `Invalid source_item_ids referenced: [${refCheck.unknownIds.join(", ")}]. Must reference valid digest IDs: [${context.digestItems.map((i) => i.id).join(", ")}]`,
        ];
        retryFeedback = lastErrors.join("\n");
        console.warn(
          `[format] article=${context.articleId} format=${formatName} attempt=${attempt} status=unknown_digest_refs`
        );
        continue;
      }

      return {
        slots: parsed.data,
        referencedItemIds: parsed.data.source_item_ids,
        retriesUsed: attempt,
      };
    } catch (err) {
      lastErrors = [err instanceof Error ? err.message : String(err)];
      retryFeedback = `LLM generation error: ${lastErrors[0]}`;
      console.warn(
        `[format] article=${context.articleId} format=${formatName} attempt=${attempt} status=llm_error error="${lastErrors[0]}"`
      );
      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw new Error(
    `Failed to generate format "${formatName}" for article "${context.articleId}" after ${maxRetries} retries. Errors: ${lastErrors.join("; ")}`
  );
}

