/**
 * Counter-Intuitive Insight Digest Kind Definition
 * Represents surprising discoveries, myth-busting conclusions, or paradoxes.
 */

import { DigestKindDefinition } from "../types";

export const counterIntuitiveInsightKind: DigestKindDefinition = {
  id: "counter_intuitive_insight",
  name: "Counter-Intuitive Insight",
  description: "A non-obvious observation, surprising contrast, or debunked conventional wisdom.",
  extractionPromptGuidance: "Extract facts or conclusions that challenge common assumptions or reveal unexpected truths.",
  typicalLengthRange: {
    minChars: 40,
    maxChars: 280,
  },
};

