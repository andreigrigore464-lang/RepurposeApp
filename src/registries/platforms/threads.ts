/**
 * Threads Platform Definition
 * Boundary constraints, character limits, and thread packaging rules for Threads.
 */

import { PlatformDefinition } from "../types";

export const threadsPlatform: PlatformDefinition = {
  id: "threads",
  name: "Threads",
  description: "Conversational microblogging platform with a 500-character post limit and thread support.",
  constraints: {
    maxCharacters: 500,
    hashtagPolicy: {
      minCount: 0,
      maxCount: 1,
      placement: "end-of-post",
    },
    mediaCapabilities: {
      supportsSingleImage: true,
      supportsThread: true,
      supportsCarouselPdf: false,
      supportsImageSequence: true,
      maxImageCount: 10,
    },
    formattingRules: {
      supportsClickableLinks: true,
      paragraphSeparator: "\n\n",
    },
  },
};

