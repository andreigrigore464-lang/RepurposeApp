/**
 * Core Thesis Digest Kind Definition
 * Represents the central argument, primary thesis, or main conclusion of an article.
 */

import { DigestKindDefinition } from "../types";

export const coreThesisKind: DigestKindDefinition = {
  id: "core_thesis",
  name: "Core Thesis",
  description: "The primary thesis, central argument, or fundamental thesis statement.",
  extractionPromptGuidance: "Extract the central claim or overarching thesis of the article in 1-2 concise sentences.",
  typicalLengthRange: {
    minChars: 40,
    maxChars: 300,
  },
};

