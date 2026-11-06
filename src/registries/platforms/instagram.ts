/**
 * Instagram Platform Definition
 * Boundary constraints, image sequence support, and caption rules for Instagram.
 */

import { PlatformDefinition } from "../types";

export const instagramPlatform: PlatformDefinition = {
  id: "instagram",
  name: "Instagram",
  description: "Visual-first platform supporting single cards, multi-image carousels, and captions up to 2200 chars.",
  constraints: {
    maxCharacters: 2200,
    visibleFoldCharacters: 125,
    hashtagPolicy: {
      minCount: 3,
      maxCount: 10,
      placement: "end-of-post",
    },
    mediaCapabilities: {
      supportsSingleImage: true,
      supportsThread: false,
      supportsCarouselPdf: false,
      supportsImageSequence: true,
      maxImageCount: 10,
    },
    formattingRules: {
      supportsClickableLinks: false,
      paragraphSeparator: "\n\n",
    },
  },
};

