import { describe, it, expect } from "vitest";
import {
  isVerbatimMatch,
  validateDigestGrounding,
} from "./validate-digest-grounding";

describe("Digest Grounding & Anti-Hallucination Validator", () => {
  const sampleArticle = `
    Formula 1 driver Carlos Sainz believes having two competitive drivers fighting for wins will always create friction.
    "It's more difficult maybe to follow exactly the ideal situation that the team would like you to follow, because there's a win down the line," Sainz added.
    "I cannot remember no Formula 1 team that has had two good drivers fighting at the front that haven't had issues."
  `;

  it("matches verbatim sentences correctly", () => {
    const sentence =
      "Formula 1 driver Carlos Sainz believes having two competitive drivers fighting for wins will always create friction.";
    expect(isVerbatimMatch(sentence, sampleArticle)).toBe(true);
  });

  it("handles dialogue punctuation normalization (quote ending in period vs comma in article)", () => {
    // LLM extracted dialogue as standalone sentence ending in a period, while article had comma before Sainz added
    const sentence =
      '"It\'s more difficult maybe to follow exactly the ideal situation that the team would like you to follow, because there\'s a win down the line."';
    expect(isVerbatimMatch(sentence, sampleArticle)).toBe(true);
  });

  it("rejects hallucinated sentences not present in the article", () => {
    const hallucination =
      "Carlos Sainz decided to leave Ferrari and sign with Red Bull Racing.";
    expect(isVerbatimMatch(hallucination, sampleArticle)).toBe(false);
  });

  it("validates a complete grounded digest successfully", () => {
    const validCandidate = {
      items: [
        {
          id: "item_1",
          kind: "direct_quote",
          text: "Sainz notes that having two top drivers naturally produces intra-team tension.",
          source_sentences: [
            '"It\'s more difficult maybe to follow exactly the ideal situation that the team would like you to follow, because there\'s a win down the line."',
          ],
        },
        {
          id: "item_2",
          kind: "core_thesis",
          text: "Having two competitive drivers fighting for race victories will inevitably lead to friction.",
          source_sentences: [
            "Formula 1 driver Carlos Sainz believes having two competitive drivers fighting for wins will always create friction.",
          ],
        },
        {
          id: "item_3",
          kind: "key_takeaway",
          text: "History shows that top teams with two leading drivers always experience internal battles.",
          source_sentences: [
            '"I cannot remember no Formula 1 team that has had two good drivers fighting at the front that haven\'t had issues."',
          ],
        },
      ],
    };

    const result = validateDigestGrounding(validCandidate, sampleArticle);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.digest?.items).toHaveLength(3);
  });

  it("fails validation and identifies hallucinated items with explicit errors", () => {
    const invalidCandidate = {
      items: [
        {
          id: "item_1",
          kind: "direct_quote",
          text: "Valid text for item 1 that passes minimum length.",
          source_sentences: [
            "Formula 1 driver Carlos Sainz believes having two competitive drivers fighting for wins will always create friction.",
          ],
        },
        {
          id: "item_2",
          kind: "key_takeaway",
          text: "Valid text for item 2 that passes minimum length.",
          source_sentences: [
            '"I cannot remember no Formula 1 team that has had two good drivers fighting at the front that haven\'t had issues."',
          ],
        },
        {
          id: "item_hallucinated",
          kind: "direct_quote",
          text: "Carlos Sainz said something he never said in the source.",
          source_sentences: ["This sentence does not exist in the source article at all."],
        },
      ],
    };

    const result = validateDigestGrounding(invalidCandidate, sampleArticle);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes("Hallucination detected"))).toBe(true);
  });
});
