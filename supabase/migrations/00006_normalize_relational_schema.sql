-- Migration: 00006_normalize_relational_schema.sql
-- Description: Normalizes workflows, custom templates, and reel feedback out of brand_kits.custom_templates JSONB.
-- Promotes scheduling timestamps out of format_outputs.slots_data into indexed columns.
-- Adds missing foreign key and status performance indexes.

-- 1. Create Workflows Table
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES feeds(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  poll_interval_minutes INT NOT NULL DEFAULT 60,
  enabled_formats JSONB NOT NULL DEFAULT '["text-post","thread","card","carousel"]',
  card_template_id TEXT,
  carousel_template_id TEXT,
  video_reel_template_id TEXT,
  target_clips_count INT DEFAULT 3,
  target_duration TEXT DEFAULT '30-60',
  language TEXT,
  vocabulary_hint TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_brand_id ON workflows(brand_id);
CREATE INDEX IF NOT EXISTS idx_workflows_feed_id ON workflows(feed_id);

-- 2. Create Custom Templates Table
CREATE TABLE IF NOT EXISTS custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'card', -- 'card' | 'carousel' | 'reel'
  aspect_ratio TEXT NOT NULL DEFAULT '1:1', -- '1:1' | '4:5' | '9:16'
  schema_version INT NOT NULL DEFAULT 1,
  template_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_templates_brand_id ON custom_templates(brand_id);

-- 3. Create Reel Feedback Table
CREATE TABLE IF NOT EXISTS reel_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  format_output_id UUID REFERENCES format_outputs(id) ON DELETE CASCADE,
  rating TEXT NOT NULL, -- 'yes' | 'no'
  comment TEXT,
  hook_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reel_feedback_brand_id ON reel_feedback(brand_id);
CREATE INDEX IF NOT EXISTS idx_reel_feedback_format_output_id ON reel_feedback(format_output_id);

-- 4. Create Trust Votes Table
CREATE TABLE IF NOT EXISTS trust_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  vote TEXT NOT NULL, -- 'yes' | 'no'
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_trust_votes_brand UNIQUE (brand_id)
);

CREATE INDEX IF NOT EXISTS idx_trust_votes_brand_id ON trust_votes(brand_id);

-- 5. Promote Calendar Scheduling Columns onto format_outputs
ALTER TABLE format_outputs
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_has_time BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Backfill scheduled_at and published_at from slots_data if present
UPDATE format_outputs
SET scheduled_at = (slots_data->>'scheduled_at')::timestamptz,
    scheduled_has_time = COALESCE((slots_data->>'scheduled_has_time')::boolean, false)
WHERE slots_data ? 'scheduled_at' AND scheduled_at IS NULL;

UPDATE format_outputs
SET published_at = (slots_data->>'published_at')::timestamptz
WHERE slots_data ? 'published_at' AND published_at IS NULL;

-- 5. Foreign Key & Query Performance Indexes
CREATE INDEX IF NOT EXISTS idx_format_outputs_scheduled 
  ON format_outputs(brand_id, scheduled_at) 
  WHERE scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feeds_brand_id ON feeds(brand_id);
CREATE INDEX IF NOT EXISTS idx_articles_brand_status ON articles(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_digests_article_id ON digests(article_id);
CREATE INDEX IF NOT EXISTS idx_format_outputs_brand_status ON format_outputs(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_format_outputs_article_id ON format_outputs(article_id);
CREATE INDEX IF NOT EXISTS idx_platform_variants_format_output_id ON platform_variants(format_output_id);
