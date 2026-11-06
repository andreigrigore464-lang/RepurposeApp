/**
 * Problem Context Digest Kind Definition
 * Represents the background friction, pain point, or context that motivated the article.
 */

import { DigestKindDefinition } from "../types";

export const problemContextKind: DigestKindDefinition = {
  id: "problem_context",
  name: "Problem Context",
  description: "The underlying problem, industry friction, or question addressed in the piece.",
  extractionPromptGuidance: "Extract the core pain point or context that sets up the reason for the article.",
  typicalLengthRange: {
    minChars: 40,
    maxChars: 280,
  },
};

