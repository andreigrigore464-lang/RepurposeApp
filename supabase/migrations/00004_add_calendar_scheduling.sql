-- Migration 00004: Add calendar scheduling and trust vote documentation
-- Documents the calendar scheduling state within format_outputs and trust polling within brand_kits.

-- format_outputs.status can now hold: 'draft', 'reviewed', 'scheduled', 'published', 'exported', 'failed'
-- format_outputs.slots_data contains:
--   scheduled_at (TEXT, ISO date/time like '2026-11-06' or '2026-11-06T09:30:00.000Z')
--   scheduled_has_time (BOOLEAN, true if user scheduled with hour/time in advanced mode)
--   published_at (TEXT, ISO timestamp when marked published)

-- brand_kits.custom_templates contains:
--   autoPostTrustVote: { vote: 'yes' | 'no', votedAt: string }

COMMENT ON TABLE format_outputs IS 'Holds format outputs; scheduling is tracked via status (scheduled/published) and slots_data (scheduled_at, scheduled_has_time, published_at)';

