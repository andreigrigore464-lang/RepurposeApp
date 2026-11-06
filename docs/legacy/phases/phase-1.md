# Phase 1: Project Skeleton & Environment Setup

## Goal
Initialize Next.js with TypeScript and App Router, set up Supabase migrations + seed (default account/brand), Inngest dev setup, design skills installed, folder READMEs.

## Tasks
1. [x] Initialize Next.js project with TypeScript, Tailwind CSS, and App Router.
2. [x] Configure Supabase local/remote environment and initial migrations:
   - Migration `00001_create_schema.sql` (accounts, brands, brand_kits, feeds, articles, digests, format_outputs, platform_variants, waitlist).
   - Migration `00002_seed_defaults.sql` (insert default account, brand, and brand kit).
3. [x] Implement `src/lib/current-context.ts` to return seeded default IDs.
4. [x] Set up Inngest client and Next.js route handler (`src/app/api/inngest/route.ts`).
5. [x] Install workspace design skills:
   - Cloned `ui-ux-pro-max-skill` and installed into `.agents/skills/ui-ux-pro-max/`.
   - Cloned `impeccable` and installed into `.agents/skills/impeccable/`.
6. [x] Bundle SIL open-source typography in `public/fonts/` (`Inter-Regular.ttf`, `PlayfairDisplay-Bold.ttf`).
7. [x] Add `README.md` to every top-level folder in `src/` and project root.
8. [x] Verify minimal dependencies and log packages in `docs/decisions.md` (ADR 012).
9. [x] Verified Next.js production build (`npm run build`) and dev server (`npm run dev`) serving HTTP 200.

## Done When
- [x] Next.js development server runs cleanly locally (tested on port 3005, HTTP 200).
- [x] Installed design skills are verified and listed in `.agents/skills/`.
- [x] Folder `README.md` files are in place across all directories.
- [x] Seed account, brand, and brand kit are queryable in Supabase (Verified with `npm run db:verify` on 2026-10-31).
