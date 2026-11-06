/**
 * Manual URL Input Type Definition
 * Represents direct, one-off article ingestion from a pasted web page URL.
 */

import { InputTypeDefinition } from "../types";

export const manualUrlInput: InputTypeDefinition = {
  id: "manual-url",
  name: "Manual Article URL",
  description: "Direct single-article ingestion via pasted webpage URL fallback.",
  requiresUrl: true,
  supportsPolling: false,
};

