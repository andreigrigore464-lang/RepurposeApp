-- Migration: 00005_add_video_reels_pipeline.sql
-- Description: Adds video source tracking, media metadata, and the asynchronous video render jobs queue table.

-- 1. Extend articles table for video inputs (YouTube URLs and uploaded media)
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS media_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Comment for domain intelligibility
COMMENT ON COLUMN articles.source_type IS 'Indicates content origin: article, youtube, or video_upload';
COMMENT ON COLUMN articles.media_metadata IS 'Stores media specifics: duration_seconds, resolution, thumbnail_url, storage_key';

-- 2. Create the video_render_jobs table for decoupled worker execution
CREATE TABLE IF NOT EXISTS video_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  progress_pct INT NOT NULL DEFAULT 0,
  stage_message TEXT DEFAULT 'Waiting in queue...',
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for fast polling by Python worker and fast status lookups by UI
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_status ON video_render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_article_id ON video_render_jobs(article_id);
CREATE INDEX IF NOT EXISTS idx_video_render_jobs_brand_id ON video_render_jobs(brand_id);

COMMENT ON TABLE video_render_jobs IS 'Asynchronous queue and progress tracker for Python video worker (whisper, hook detection, ffmpeg)';

