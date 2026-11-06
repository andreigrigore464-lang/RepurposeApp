# 01 — System Architecture & Data Flow

## 1. High-Level Concept: Format-First, Platform-Last

The system separates content *shape* from social platform *packaging*.

```
Input (RSS / URL)
       │
       ▼
[Stage 1: Ingest] ───> Extract text & in-article images; deduplicate
       │
       ▼
[Stage 2: Digest] ───> LLM extracts grounded atomic items + exact source sentences
       │
       ▼
[Stage 3: Format] ───> LLM synthesizes platform-agnostic format objects (slots)
       │
       ▼
[Stage 4: Adapt]  ───> Deterministic code applies platform constraints & rules
       │
       ▼
[Render & Export] ───> Konva renders card/carousel; clipboard/PDF/ZIP export
```

### The Matrix Principle
- **Formats** (`text-post`, `thread`, `card`, `carousel`) define the structure and content slots independently of where they might be posted.
- **Platforms** (`linkedin`, `x`, `instagram`, `facebook`, `threads`) are purely destination constraints (character limits, hashtag placements, max images, aspect ratios).
- The **Matrix** declares valid mappings:
  - Which `Input Kind` can yield which `Format Kind`.
  - Which `Format Kind` can be adapted to which `Platform`.
- Both the engine and the pipeline are **100% generic**:
  - All input types, digest item kinds, formats, platforms, and matrix mappings live in declarative registry definitions validated at startup.
  - Adding a new format or platform requires creating a definition file and registering it, with **zero engine changes**.

---

## 2. Pipeline Stages & Responsibilities

| Stage | Name | Input | Output | Primary Tech |
|---|---|---|---|---|
| **1** | **Ingest** | Feed URL or manual article URL | Normalized article (`title`, `canonical_url`, `content_text`, `images[]`) | Cheerio / Readability / RSS parser |
| **2** | **Digest** | Normalized article + Brand profile | Grounded digest items (`id`, `kind`, `text`, `source_sentences[]`) | LLM + Zod structured schema |
| **3** | **Format** | Grounded digest items + Format registry rules | Slot-filled format output (`format_id`, `slots`, `item_refs[]`) | LLM + Zod structured schema |
| **4** | **Adapt** | Format output + Platform constraints | Platform variant (`platform_id`, `payload`, `warnings[]`) | Pure TypeScript deterministic adapter |
| **5** | **Render** | Format variant slots + Brand theme + Template JSON | Image canvas / PDF / PNG buffer | Konva (`konva` in browser, `canvas` + `konva` on server) |

---

## 3. Directory Structure

```
d:/Work/RepurposeApp/
├── AGENTS.md                  # System rules and agent constraints
├── .agents/skills/            # Workspace design skills (installed in Phase 1)
├── docs/                      # Specification and architectural documentation
│   ├── 00-product.md          # Problem, users, scope boundaries
│   ├── 01-architecture.md     # Pipeline diagram, data flow, architecture
│   ├── 02-registries.md       # Registries, schema definitions, matrix rules
│   ├── 03-pipeline.md         # Stage contracts, inputs, outputs, error states
│   ├── 04-rendering.md        # Template JSON schema and Konva rendering specs
│   ├── 05-data-model.md       # Database tables, foreign keys, schema migrations
│   ├── platforms/             # Platform-specific constraints (declarative specs)
│   │   ├── linkedin.md
│   │   ├── x.md
│   │   ├── instagram.md
│   │   ├── facebook.md
│   │   └── threads.md
│   ├── design-system.md       # Visual styling guidelines & tokens
│   ├── decisions.md           # Architecture Decision Records (ADRs)
│   ├── open-questions.md      # Unresolved items & clarifications
│   └── phases/                # Phase definitions and acceptance checklists
│       ├── phase-0.md
│       ├── phase-1.md
│       ├── ...
│       └── phase-9.md
├── src/
│   ├── registries/            # Declarative definitions & validation
│   │   ├── input-types/       # RSS, URL definitions
│   │   ├── digest-kinds/      # Core claim, stat, takeaway, quote, etc.
│   │   ├── formats/           # Text post, thread, card, carousel schemas
│   │   ├── platforms/         # Constraints (LinkedIn, X, Instagram, etc.)
│   │   ├── matrix.ts          # Permitted Input->Format and Format->Platform mappings
│   │   └── load-registries.ts # Startup validation using Zod
│   ├── pipeline/              # Sequential business logic
│   │   ├── 1-ingest/          # Feed fetchers, HTML parser, deduplication
│   │   ├── 2-digest/          # Grounded digest extraction via LLM
│   │   ├── 3-format/          # Slot synthesis into platform-agnostic formats
│   │   └── 4-adapt/           # Constraint application and variant generation
│   ├── render/                # Konva template rendering
│   │   ├── template-schema.ts # Zod schema for template JSON
│   │   ├── templates/         # 1 card template, 1 carousel template JSON
│   │   ├── layout/            # Layout calculations & font metrics
│   │   ├── render-in-browser.tsx # Client-side Konva canvas
│   │   └── render-on-server.ts   # Server-side Node canvas renderer
│   ├── export/                # Downloader & packager (PNG, PDF, ZIP, clipboard)
│   ├── llm/                   # LLM client interface & provider wrapper
│   ├── db/                    # Supabase client & small table query modules
│   ├── jobs/                  # Inngest background job definitions
│   ├── lib/
│   │   └── current-context.ts # The single seam for hardcoded account/brand
│   └── app/                   # Next.js App Router (thin UI and route handlers)
└── supabase/
    └── migrations/            # Plain SQL migration files
```

