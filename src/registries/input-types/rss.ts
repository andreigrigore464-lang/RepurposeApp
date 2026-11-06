/**
 * RSS Feed Input Type Definition
 * Represents automated RSS/Atom feed polling to ingest new articles.
 */

import { InputTypeDefinition } from "../types";

export const rssInput: InputTypeDefinition = {
  id: "rss",
  name: "RSS / Atom Feed",
  description: "Polls an RSS or Atom feed endpoint periodically for newly published articles.",
  requiresUrl: true,
  supportsPolling: true,
};

