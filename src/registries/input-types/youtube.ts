/**
 * YouTube Input Type Definition
 * Represents single video links or automated YouTube channel RSS feed polling.
 */

import { InputTypeDefinition } from "../types";

export const youtubeInput: InputTypeDefinition = {
  id: "youtube",
  name: "YouTube Video / Channel",
  description: "Polls YouTube channel uploads via Atom/RSS or processes a single YouTube video link.",
  requiresUrl: true,
  supportsPolling: true,
};
