/**
 * Grounding Provenance & Schema Validator
 * Enforces strict anti-hallucination rules: verifies every source sentence is a verbatim
 * substring of the original article text and adheres to registered digest kinds.
 * Pipeline Stage: 2-digest
 */

import { GroundedDigestSchema, GroundedDigest } from "./digest-schema";
import { ALL_DIGEST_KINDS } from "../../registries/digest-kinds/all-digest-kinds";

export interface GroundingValidationResult {
  isValid: boolean;
  errors: string[];
  digest?: GroundedDigest;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/[\u2018\u2019\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u00A0\s]+/g, " ")
    .toLowerCase();
}

export function validateDigestGrounding(
  rawCandidate: unknown,
  articleText: string
): GroundingValidationResult {
  const errors: string[] = [];

  // 1. Zod schema validation
  const parsed = GroundedDigestSchema.safeParse(rawCandidate);
  if (!parsed.success) {
    return {
      isValid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      ),
    };
  }

  const digest = parsed.data;
  const validKinds = new Set(ALL_DIGEST_KINDS.map((k) => k.id));
  const normalizedArticle = normalizeText(articleText);

  // 2. Validate items
  for (const item of digest.items) {
    // Check registered kind
    if (!validKinds.has(item.kind)) {
      errors.push(
        `Item "${item.id}" has unregistered kind "${item.kind}". Valid kinds are: [${Array.from(validKinds).join(", ")}]`
      );
    }

    // Check verbatim grounding provenance
    for (const sentence of item.source_sentences) {
      const normalizedSentence = normalizeText(sentence);
      if (!normalizedArticle.includes(normalizedSentence)) {
        errors.push(
          `Hallucination detected in item "${item.id}": Source sentence "${sentence}" does not exist verbatim in the source article text.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    digest: errors.length === 0 ? digest : undefined,
  };
}

