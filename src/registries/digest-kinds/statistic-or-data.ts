/**
 * Statistic or Data Digest Kind Definition
 * Represents a quantitative fact, percentage, metric, or benchmark stated in the article.
 */

import { DigestKindDefinition } from "../types";

export const statisticOrDataKind: DigestKindDefinition = {
  id: "statistic_or_data",
  name: "Statistic or Metric",
  description: "A specific number, percentage, measurement, benchmark, or quantitative finding.",
  extractionPromptGuidance: "Extract quantitative data points, statistics, or numerical findings mentioned in the text.",
  typicalLengthRange: {
    minChars: 20,
    maxChars: 200,
  },
};

