/**
 * Inngest Job Client
 * Configures the Inngest background event bus for orchestrating
 * RSS polling, digest extraction, format generation, and canvas rendering jobs.
 */

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "article-repurpose-app",
  name: "Article Repurposing Engine",
});

