-- Migration 00003: Add custom_templates to brand_kits
-- Allows storing declarative custom templates per brand for social cards and carousels.

ALTER TABLE brand_kits
ADD COLUMN IF NOT EXISTS custom_templates JSONB NOT NULL DEFAULT '{}';

