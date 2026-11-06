/**
 * Facebook Platform Definition
 * Boundary constraints, character limits, and media packaging rules for Facebook.
 */

import { PlatformDefinition } from "../types";

export const facebookPlatform: PlatformDefinition = {
  id: "facebook",
  name: "Facebook",
  description: "Social networking platform supporting long-form narrative posts and single image cards.",
  constraints: {
    maxCharacters: 5000,
    visibleFoldCharacters: 400,
    hashtagPolicy: {
      minCount: 0,
      maxCount: 2,
      placement: "end-of-post",
    },
    mediaCapabilities: {
      supportsSingleImage: true,
      supportsThread: false,
      supportsCarouselPdf: false,
      supportsImageSequence: false,
      maxImageCount: 10,
    },
    formattingRules: {
      supportsClickableLinks: true,
      paragraphSeparator: "\n\n",
    },
  },
};

