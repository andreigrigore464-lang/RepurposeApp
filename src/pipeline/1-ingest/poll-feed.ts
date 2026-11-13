/**
 * Feed Polling Pipeline Action
 * Coordinates polling an RSS/Atom or YouTube channel feed, extracting new content, and persisting non-duplicates.
 * Pipeline Stage: 1-ingest
 */

import { createHash } from "crypto";
import { fetchRssFeed } from "./fetch-rss-feed";
import { fetchAndExtractArticle } from "./extract-article";
import { generateArticleFingerprint } from "./deduplicate-article";
import { findArticleByUrlOrHash, insertArticle, ArticleRecord } from "../../db/queries-articles";
import { updateFeedLastPolled, FeedRecord } from "../../db/queries-feeds";
import { getWorkflowSettings } from "../../db/queries-brand-kit";
import { dispatchArticlePipeline } from "../../jobs/dispatch-pipeline";
import { createVideoRenderJob } from "../../db/queries-video-jobs";

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

  const isYoutubeFeed =
    feed.feed_url.includes("youtube.com/feeds/videos.xml") ||
    matchedWorkflow?.sourceType === "youtube";

  const newArticles: ArticleRecord[] = [];
  let skippedDuplicates = 0;
  let failedArticles = 0;

  for (let idx = 0; idx < parsed.items.length; idx++) {
    const item = parsed.items[idx];
    try {
      if (isYoutubeFeed) {
        // YouTube channel safety: If initial poll, only ingest videos published after workflow creation
        // or at most the single latest video (idx === 0) so we don't enqueue an entire back-catalog.
        if (!feed.last_polled_at && matchedWorkflow?.createdAt) {
          const itemDate = item.publishedAt ? new Date(item.publishedAt).getTime() : 0;
          const wfDate = new Date(matchedWorkflow.createdAt).getTime();
          if (itemDate < wfDate && idx > 0) {
            skippedDuplicates++;
            continue;
          }
        }

        const videoMatch = item.link.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/);
        const videoId = videoMatch ? videoMatch[2] : undefined;
        const normalizedUrl = item.link;
        const contentHash = createHash("sha256").update(normalizedUrl).digest("hex");

        const existing = await findArticleByUrlOrHash({
          brandId: feed.brand_id,
          canonicalUrl: normalizedUrl,
          contentHash,
        });

        if (existing) {
          skippedDuplicates++;
          continue;
        }

        const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined;

        const article = await insertArticle({
          brandId: feed.brand_id,
          feedId: feed.id,
          canonicalUrl: normalizedUrl,
          contentHash,
          title: item.title,
          author: parsed.feedTitle || "YouTube Creator",
          publishedAt: item.publishedAt,
          cleanText: `YouTube Video: ${item.title}\nURL: ${item.link}`,
          inArticleImages: thumbnailUrl ? [thumbnailUrl] : [],
          sourceType: "youtube",
          mediaMetadata: {
            videoId,
            thumbnailUrl,
          },
        });

        newArticles.push(article);
      } else {
        // Traditional Written Article Ingestion
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
          sourceType: "article",
        });

        newArticles.push(article);
      }
    } catch (err) {
      failedArticles++;
      console.warn(`[ingest] feed=${feed.id} item="${item.link}" status=failed error="${err instanceof Error ? err.message : String(err)}"`);
    }
  }

  await updateFeedLastPolled(feed.id);

  console.log(
    `[ingest] feed=${feed.id} items_found=${parsed.items.length} new=${newArticles.length} duplicates=${skippedDuplicates} errors=${failedArticles}`
  );

  // Sequentially process newly ingested items
  for (const article of newArticles) {
    try {
      if (article.source_type === "youtube") {
        console.log(`[pipeline:video] Enqueuing render job for video article=${article.id} ("${article.title}")`);
        await createVideoRenderJob({
          brandId: feed.brand_id,
          articleId: article.id,
          configJson: {
            source_type: "youtube",
            video_url: article.canonical_url,
            canonical_url: article.canonical_url,
            title: article.title,
            thumbnail_url: (article.media_metadata as any)?.thumbnailUrl,
            template_id: matchedWorkflow?.videoReelTemplateId,
            clip_selection_mode: "ai_auto",
            clips_count: matchedWorkflow?.targetClipsCount || 3,
            target_duration: matchedWorkflow?.targetDuration || "30-60",
            language: matchedWorkflow?.language,
            vocabulary_hint: matchedWorkflow?.vocabularyHint,
          },
        });
      } else {
        console.log(`[pipeline:queue] Dispatching background pipeline for article=${article.id} ("${article.title}")`);
        await dispatchArticlePipeline({
          articleId: article.id,
          brandId: feed.brand_id,
          options: matchedWorkflow
            ? {
                workflowConfig: {
                  enabledFormats: matchedWorkflow.enabledFormats,
                  cardTemplateId: matchedWorkflow.cardTemplateId,
                  carouselTemplateId: matchedWorkflow.carouselTemplateId,
                },
              }
            : undefined,
        });
      }
    } catch (pipeErr) {
      console.error(`[pipeline] Auto-run error for item=${article.id}:`, pipeErr);
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
