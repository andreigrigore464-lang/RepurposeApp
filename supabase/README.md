# supabase/ — Database Schema & Migrations

This directory tracks the database schema using plain SQL migration files.

## Guidelines
- All schema changes must be authored as ordered SQL migrations in `supabase/migrations/`.
- No ORMs; database access is executed through pure SQL statements and `@supabase/supabase-js`.
- Foreign key integrity is strictly enforced across `accounts -> brands -> feeds -> articles -> digests -> format_outputs -> platform_variants`.

## Migrations
- `migrations/00001_create_schema.sql` — Schema definition for all core tables and constraints.
- `migrations/00002_seed_defaults.sql` — Seed data for the default account, brand, and brand kit.

