/**
 * X (Twitter) Platform Definition
 * Boundary constraints, character limits, and thread packaging rules for X.
 */

import { PlatformDefinition } from "../types";

export const xPlatform: PlatformDefinition = {
  id: "x",
  name: "X (Twitter)",
  description: "Microblogging platform with a strict 280-character limit per post and thread support.",
  constraints: {
    maxCharacters: 280,
    hashtagPolicy: {
      minCount: 0,
      maxCount: 2,
      placement: "inline",
    },
    mediaCapabilities: {
      supportsSingleImage: true,
      supportsThread: true,
      supportsCarouselPdf: false,
      supportsImageSequence: false,
      maxImageCount: 4,
    },
    formattingRules: {
      supportsClickableLinks: true,
      linkCharBudgetCost: 23,
      paragraphSeparator: "\n\n",
    },
  },
};

