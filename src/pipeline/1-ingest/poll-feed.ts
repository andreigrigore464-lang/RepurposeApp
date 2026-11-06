/**
 * Feed Polling Pipeline Action
 * Coordinates polling an RSS feed, extracting new articles, and persisting non-duplicates.
 * Pipeline Stage: 1-ingest
 */

import { fetchRssFeed } from "./fetch-rss-feed";
import { fetchAndExtractArticle } from "./extract-article";
import { generateArticleFingerprint } from "./deduplicate-article";
import { findArticleByUrlOrHash, insertArticle, ArticleRecord } from "../../db/queries-articles";
import { updateFeedLastPolled, FeedRecord } from "../../db/queries-feeds";
import { getWorkflowSettings } from "../../db/queries-brand-kit";
import { runArticlePipeline } from "../run-article-pipeline";

export interface PollFeedResult {
  feedId: string;
  totalFound: number;
  newArticles: ArticleRecord[];
  skippedDuplicates: number;
  failedArticles: number;
  error?: string;
}

export async function pollFeedAndIngestArticles(feed: FeedRecord): Promise<PollFeedResult> {
  // Check if feed belongs to a paused workflow
  const workflowSettings = await getWorkflowSettings(feed.brand_id);
  const matchedWorkflow = workflowSettings.workflows?.find((w) => w.feedId === feed.id);
  if (matchedWorkflow && matchedWorkflow.isActive === false) {
    console.log(`[ingest] feed=${feed.id} workflow="${matchedWorkflow.name}" is paused. Skipping automated poll.`);
    return {
      feedId: feed.id,
      totalFound: 0,
      newArticles: [],
      skippedDuplicates: 0,
      failedArticles: 0,
    };
  }

  let parsed;
  try {
    parsed = await fetchRssFeed(feed.feed_url);
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`[ingest] feed=${feed.id} url="${feed.feed_url}" fetch error: ${errorMsg}`);
    await updateFeedLastPolled(feed.id);
    return {
      feedId: feed.id,
      totalFound: 0,
      newArticles: [],
      skippedDuplicates: 0,
      failedArticles: 0,
      error: errorMsg,
    };
  }

  const newArticles: ArticleRecord[] = [];
  let skippedDuplicates = 0;
  let failedArticles = 0;

  for (const item of parsed.items) {
    try {
      const extracted = await fetchAndExtractArticle(item.link);
      const fingerprint = generateArticleFingerprint(extracted.canonicalUrl, extracted.cleanText);

      const existing = await findArticleByUrlOrHash({
        brandId: feed.brand_id,
        canonicalUrl: fingerprint.normalizedUrl,
        contentHash: fingerprint.contentHash,
      });

      if (existing) {
        skippedDuplicates++;
        continue;
      }

      const article = await insertArticle({
        brandId: feed.brand_id,
        feedId: feed.id,
        canonicalUrl: fingerprint.normalizedUrl,
        contentHash: fingerprint.contentHash,
        title: extracted.title || item.title,
        author: extracted.author,
        publishedAt: extracted.publishedAt || item.publishedAt,
        rawHtml: extracted.rawHtml,
        cleanText: extracted.cleanText,
        inArticleImages: extracted.inArticleImages,
      });

      newArticles.push(article);
    } catch (err) {
      failedArticles++;
      console.warn(`[ingest] feed=${feed.id} item="${item.link}" status=failed error="${err instanceof Error ? err.message : String(err)}"`);
    }
  }

  await updateFeedLastPolled(feed.id);

  console.log(
    `[ingest] feed=${feed.id} items_found=${parsed.items.length} new=${newArticles.length} duplicates=${skippedDuplicates} errors=${failedArticles}`
  );

  // Sequentially process newly ingested articles with breathing room to respect API token rates
  for (const article of newArticles) {
    try {
      console.log(`[pipeline:queue] Processing queued article=${article.id} ("${article.title}")`);
      await runArticlePipeline(article.id);
      // Brief 2-second pacing between articles
      await new Promise((r) => setTimeout(r, 2000));
    } catch (pipeErr) {
      console.error(`[pipeline] Auto-run error for article=${article.id}:`, pipeErr);
    }
  }

  return {
    feedId: feed.id,
    totalFound: parsed.items.length,
    newArticles,
    skippedDuplicates,
    failedArticles,
  };
}

