/**
 * Solution Example Digest Kind Definition
 * Represents concrete examples, case studies, or scenarios described in the text.
 */

import { DigestKindDefinition } from "../types";

export const solutionExampleKind: DigestKindDefinition = {
  id: "solution_example",
  name: "Solution Example",
  description: "A concrete example, scenario, or historical incident illustrating the thesis.",
  extractionPromptGuidance: "Extract specific examples, anecdotes, or case studies used to demonstrate the solution.",
  typicalLengthRange: {
    minChars: 40,
    maxChars: 300,
  },
};

