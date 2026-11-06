/**
 * Feed Polling Background Job
 * Scheduled job triggered by Inngest to poll all registered feeds for new articles.
 * Jobs Layer
 */

import { inngest } from "./inngest-client";
import { listFeedsForBrand } from "../db/queries-feeds";
import { pollFeedAndIngestArticles } from "../pipeline/1-ingest/poll-feed";

export const pollFeedsJob = inngest.createFunction(
  {
    id: "poll-active-feeds",
    name: "Poll Active Feeds",
    retries: 2,
  },
  { event: "app/feeds.poll" },
  async ({ event, step }) => {
    const brandId = event.data.brandId as string;

    const feeds = await step.run("fetch-brand-feeds", async () => {
      return await listFeedsForBrand(brandId);
    });

    const results = [];
    for (const feed of feeds) {
      const res = await step.run(`poll-feed-${feed.id}`, async () => {
        return await pollFeedAndIngestArticles(feed);
      });
      results.push(res);
    }

    return {
      polledFeedCount: feeds.length,
      results,
    };
  }
);

