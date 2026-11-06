-- Migration: 00002_seed_defaults.sql
-- Description: Seeds the default account, brand, and brand kit providing the single-user auth seam.

INSERT INTO accounts (id, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Editorial Org',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, account_id, name, website_url, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'The Chronicle',
  'https://chronicle.example.com',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brand_kits (
  id,
  brand_id,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  font_heading,
  font_body,
  logo_url,
  voice_guidelines,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '#18181b',
  '#2563eb',
  '#ffffff',
  '#09090b',
  'Playfair Display',
  'Inter',
  NULL,
  'Authoritative, concise, analytical, grounded. No hyperbole, no engagement-bait questions.',
  now(),
  now()
)
ON CONFLICT (brand_id) DO NOTHING;

