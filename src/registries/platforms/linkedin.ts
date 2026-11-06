/**
 * LinkedIn Platform Definition
 * Boundary constraints, character ceilings, and packaging rules for LinkedIn.
 */

import { PlatformDefinition } from "../types";

export const linkedinPlatform: PlatformDefinition = {
  id: "linkedin",
  name: "LinkedIn",
  description: "Professional networking platform supporting long-form posts, single cards, and PDF document carousels.",
  constraints: {
    maxCharacters: 3000,
    visibleFoldCharacters: 210,
    hashtagPolicy: {
      minCount: 3,
      maxCount: 5,
      placement: "end-of-post",
    },
    mediaCapabilities: {
      supportsSingleImage: true,
      supportsThread: false,
      supportsCarouselPdf: true,
      supportsImageSequence: false,
      maxImageCount: 9,
    },
    formattingRules: {
      supportsClickableLinks: true,
      paragraphSeparator: "\n\n",
    },
  },
};

