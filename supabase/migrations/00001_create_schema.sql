-- Migration: 00001_create_schema.sql
-- Description: Core schema for accounts, brands, feeds, articles, digests, formats, variants, and waitlist.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Brands
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Brand Kits
CREATE TABLE IF NOT EXISTS brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
  primary_color TEXT NOT NULL DEFAULT '#18181b',
  secondary_color TEXT NOT NULL DEFAULT '#3b82f6',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#09090b',
  font_heading TEXT NOT NULL DEFAULT 'Inter',
  font_body TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  voice_guidelines TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Feeds
CREATE TABLE IF NOT EXISTS feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  title TEXT,
  last_polled_at TIMESTAMPTZ,
  poll_interval_minutes INT NOT NULL DEFAULT 60,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES feeds(id) ON DELETE SET NULL,
  canonical_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ,
  raw_html TEXT,
  clean_text TEXT NOT NULL,
  in_article_images JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'ingested',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_brand_canonical_url UNIQUE (brand_id, canonical_url)
);

-- 6. Digests
CREATE TABLE IF NOT EXISTS digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'completed',
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Format Outputs
CREATE TABLE IF NOT EXISTS format_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  digest_id UUID NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  format_kind TEXT NOT NULL,
  slots_data JSONB NOT NULL DEFAULT '{}',
  referenced_item_ids JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Platform Variants
CREATE TABLE IF NOT EXISTS platform_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format_output_id UUID NOT NULL REFERENCES format_outputs(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL,
  adapted_payload JSONB NOT NULL DEFAULT '{}',
  is_valid BOOLEAN NOT NULL DEFAULT true,
  warnings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Waitlist
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

