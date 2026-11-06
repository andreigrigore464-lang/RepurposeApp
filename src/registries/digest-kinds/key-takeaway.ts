/**
 * Key Takeaway Digest Kind Definition
 * Represents actionable lessons, primary learnings, or practical insights.
 */

import { DigestKindDefinition } from "../types";

export const keyTakeawayKind: DigestKindDefinition = {
  id: "key_takeaway",
  name: "Key Takeaway",
  description: "An actionable lesson, practical insight, or operational advice.",
  extractionPromptGuidance: "Extract concrete, actionable takeaways that summarize important points from the text.",
  typicalLengthRange: {
    minChars: 30,
    maxChars: 250,
  },
};

