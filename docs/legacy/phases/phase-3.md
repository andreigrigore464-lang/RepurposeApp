# Phase 3: Article Ingest Pipeline

## Goal
Implement RSS feed background polling via Inngest, manual URL fallback extraction, HTML article text extraction, in-article image extraction, and article deduplication.

## Tasks
1. [x] Implement RSS feed parser (`src/pipeline/1-ingest/fetch-rss-feed.ts`) supporting RSS 2.0 and Atom XML.
2. [x] Implement article extractor (`src/pipeline/1-ingest/extract-article.ts`) using Cheerio:
   - [x] Extracts canonical URL, title, author, published date, and clean text.
   - [x] Extracts in-article images strictly from `<img>` elements inside the parsed article content.
3. [x] Implement deduplication logic (`src/pipeline/1-ingest/deduplicate-article.ts`) using URL normalization and SHA-256 body hash.
4. [x] Implement database persistence functions:
   - [x] `src/db/queries-feeds.ts` (insertFeed, listFeedsForBrand, updateFeedLastPolled).
   - [x] `src/db/queries-articles.ts` (insertArticle, findArticleByUrlOrHash, listArticlesForBrand).
5. [x] Create feed polling pipeline action (`src/pipeline/1-ingest/poll-feed.ts`) and Inngest background job (`src/jobs/poll-feeds-job.ts`) with stage logging (`[ingest] ...`).
6. [x] Create API route handler for manual URL ingestion fallback (`src/app/api/ingest/route.ts`).
7. [x] Author end-to-end ingest verification script (`src/pipeline/1-ingest/verify-ingest.ts`).

## Done When
- [x] Adding a feed produces normalized articles in the database (verified: feed `73554a56-2b9a-40c7-9c52-1a5c13e3d213` and article `e93aa52f-067b-4522-95eb-ae2e3d54a3cc` stored in Supabase).
- [x] In-article images are strictly bounded by images physically present in the source article (verified: 2 images extracted).
- [x] Duplicate articles are safely skipped without errors (verified: SHA-256 hash match caught).
