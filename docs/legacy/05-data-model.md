# 05 — Data Model & Database Architecture

## 1. Relational Hierarchy & Architecture

The database is built on Supabase Postgres. Schema modifications live strictly in plain SQL migration files inside `supabase/migrations/`.

Even though user authentication and multi-tenancy UI are excluded from the MVP, the data model maintains a strict relational hierarchy:
```
accounts
  └── brands
        ├── feeds
        │     └── articles
        │           ├── digests
        │           │     └── format_outputs
        │           │           └── platform_variants
        └── brand_kits
```
Additionally, a standalone `waitlist` table handles landing page email submissions.

Every tenant-specific entity has an `account_id` and `brand_id`.
The application accesses the database through `src/lib/current-context.ts`, which returns the hardcoded default seed account and brand.
**No table or query may bypass `account_id` / `brand_id` constraints.**

---

## 2. Table Schemas

### 1. `accounts`
Stores the account organization record.
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2. `brands`
Stores brand entities associated with an account.
```sql
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3. `brand_kits`
Visual styling, logo, and editorial voice guidelines per brand.
```sql
CREATE TABLE brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL UNIQUE REFERENCES brands(id) ON DELETE CASCADE,
  primary_color TEXT NOT NULL DEFAULT '#18181b',
  secondary_color TEXT NOT NULL DEFAULT '#3b82f6',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#09090b',
  font_heading TEXT NOT NULL DEFAULT 'Inter',
  font_body TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  voice_guidelines TEXT, -- e.g. "Authoritative, concise, no hype, no emojis"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4. `feeds`
RSS feed endpoints tracked for new articles.
```sql
CREATE TABLE feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  feed_url TEXT NOT NULL,
  title TEXT,
  last_polled_at TIMESTAMPTZ,
  poll_interval_minutes INT NOT NULL DEFAULT 60,
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- non-negotiable rule
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5. `articles`
Ingested articles from feeds or manual URL inputs.
```sql
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  feed_id UUID REFERENCES feeds(id) ON DELETE SET NULL,
  canonical_url TEXT NOT NULL,
  content_hash TEXT NOT NULL, -- SHA-256 of text to deduplicate
  title TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ,
  raw_html TEXT,
  clean_text TEXT NOT NULL,
  in_article_images JSONB NOT NULL DEFAULT '[]', -- array of extracted image URLs
  status TEXT NOT NULL DEFAULT 'ingested', -- 'ingested' | 'processing' | 'digested' | 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_brand_canonical_url UNIQUE (brand_id, canonical_url)
);
```

### 6. `digests`
Grounded factual units extracted by the LLM from an article.
```sql
CREATE TABLE digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  items JSONB NOT NULL, -- Array of { id, kind, text, source_sentences: string[] }
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'failed'
  retry_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 7. `format_outputs`
Platform-agnostic format content generated from digest items.
```sql
CREATE TABLE format_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  digest_id UUID NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  format_kind TEXT NOT NULL, -- 'text-post' | 'thread' | 'card' | 'carousel'
  slots_data JSONB NOT NULL, -- Format-specific slot key-value pairs
  referenced_item_ids JSONB NOT NULL DEFAULT '[]', -- IDs from digest items
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'reviewed' | 'exported'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 8. `platform_variants`
Destination-adapted variants of a format output.
```sql
CREATE TABLE platform_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format_output_id UUID NOT NULL REFERENCES format_outputs(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL, -- 'linkedin' | 'x' | 'instagram' | 'facebook' | 'threads'
  adapted_payload JSONB NOT NULL, -- platform-specific post text, slide paths, etc.
  is_valid BOOLEAN NOT NULL DEFAULT true,
  warnings JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 9. `waitlist`
Stores landing page email captures.
```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 3. The Auth & Multi-Tenancy Seam: `src/lib/current-context.ts`

To ensure future auth integration is frictionless:
```typescript
// src/lib/current-context.ts
// Single source of truth for current account & brand context.
export interface CurrentContext {
  accountId: string;
  brandId: string;
}

export async function getCurrentContext(): Promise<CurrentContext> {
  // In MVP: returns seeded defaults from migration 00001_seed_defaults.sql
  return {
    accountId: "00000000-0000-0000-0000-000000000001",
    brandId: "00000000-0000-0000-0000-000000000002",
  };
}
```
All database queries call `getCurrentContext()` to filter by `account_id` and `brand_id`.
When auth is introduced later, this function is updated to read the authenticated session without touching any queries or business logic.

