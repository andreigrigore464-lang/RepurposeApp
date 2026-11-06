/**
 * Direct Quote Digest Kind Definition
 * Represents verbatim statements attributed to named individuals or entities in the article.
 */

import { DigestKindDefinition } from "../types";

export const directQuoteKind: DigestKindDefinition = {
  id: "direct_quote",
  name: "Direct Quote",
  description: "A memorable quote explicitly attributed to a person or organization in the text.",
  extractionPromptGuidance: "Extract exact quotes with explicit speaker attribution from the article.",
  typicalLengthRange: {
    minChars: 30,
    maxChars: 280,
  },
};

