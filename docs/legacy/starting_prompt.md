# Starting Prompt — paste everything below the line into Antigravity

---

You are building the MVP of an **article repurposing SaaS**. Read this whole prompt before doing anything. Work **spec-first**: write the spec documents, stop for my review, and only then implement, one phase at a time.

## 1. Product (what and why)
Small-to-mid digital publishers (2–15 people, several articles a week, no dedicated social media person) want their articles on more platforms without hiring anyone and without their brand looking inconsistent.

The app takes an article (from an RSS feed or a pasted URL) and turns it into platform-ready social content in the brand's voice and visual style. Everything it produces is **strictly grounded in the article**. The user reviews, edits and **exports**. The app never posts anything itself.

## 2. Core idea: the matrix (most important concept)
Content flows through **content formats first and platforms last**:

```
Input (RSS item / URL) → Ingest → [LLM] Grounded Digest → [LLM] Format object → [code] Platform adapter → Render / Export
```

- **Formats** are platform-agnostic content shapes. MVP formats: `text-post`, `thread`, `card` (single image), `carousel`.
- **Platforms** are only constraints and packaging applied at the end. MVP platforms (export only): LinkedIn, X, Instagram, Facebook, Threads.
- The **matrix** declares which `Input → Format` and `Format → Platform` pairs are allowed.
- Inputs, digest item kinds, formats, platforms and the matrix are **declarative registry files** validated with Zod at startup. The engine is generic: adding a format or platform means adding one definition file, with **zero engine changes**.
- **Never hardcode a platform name, a format name or a content field inside the engine.** If you're tempted to write `if (platform === "linkedin")` in the engine, stop. That rule belongs in the registry definition.

## 3. Hard scope boundaries
**In scope:** RSS polling + URL fallback · grounded digest · 4 formats · 5 platform adapters · brand kit (manual) · template-based image rendering · drafts inbox + review + export · simple waitlist form on the landing page.

**Out of scope. Do NOT build, scaffold or "prepare" any of these:**
- User accounts / authentication (see 6.3: there is a single seam where auth will be added later)
- Direct publishing, platform OAuth, schedulers
- Reels / video (not part of the matrix at all)
- Visual template editor (the template *format* is designed for it, but no editor UI)
- AI image generation, stock images, fetching images from anywhere except the source article
- Auto-learned brand voice or any heuristic brand inference
- Teams, roles, approvals, multi-brand UI, payments, translation, analytics

If something seems necessary but isn't listed, **ask me**. Don't add it.

## 4. Non-negotiable rules
### 4.1 Intelligibility (the core rule)
I must be able to open any file, understand it and debug it. Put these rules into `AGENTS.md` at the repo root and follow them at all times:
1. **One file = one responsibility.** File names say exactly what the file does (`fetch-rss-feed.ts`, not `utils.ts`). No `utils`/`helpers`/`misc` dumping grounds.
2. **Small files.** Aim for under ~200 lines. Split by responsibility, not arbitrarily.
3. **Plain functions over clever abstractions.** No class hierarchies, no generic factories, no dependency injection containers, no metaprogramming. Prefer boring, explicit code.
4. **Explicit data flow.** Every pipeline stage is a function with typed input and output. You can follow an article from ingest to export by reading files in order.
5. **No barrel files** (`index.ts` that re-export). Import from the real file.
6. **Comments explain *why*.** Every file starts with a 1–3 line header saying what it does and where it sits in the pipeline.
7. **Readable logs at each stage boundary** (`[digest] article=123 items=9 retries=0`).
8. **Minimal dependencies.** Before adding a package, state why in `docs/decisions.md`.
9. **Each top-level folder has a short `README.md`** explaining its purpose and the files in it.
10. **Errors are explicit.** No silent catches. Failed LLM output is validated, retried a bounded number of times, then stored as a visible failed state.

### 4.2 Anti-hallucination (product)
- Every digest item stores the **exact source sentence(s)** it came from.
- Format generation may **only** use digest items. No web search, no enrichment, no invented facts, numbers or quotes.
- Every LLM output is validated against a Zod schema, with bounded retry.
- The review UI shows the source sentence next to every post, slide or card.

### 4.3 Anti-hallucination (your behavior as the coding agent)
- Don't invent requirements. If the spec doesn't say it, ask, or write it down in `docs/open-questions.md`.
- Don't claim something works without running it. Every phase ends with its "done when" check actually executed.
- Don't refactor outside the current phase.

### 4.4 Images & content rights
- Images come only from the brand kit uploads or from **inside the source article**, at most as many images as the article contains.
- Keep a `verification_status` field on feeds (default `unverified`). Don't build any verification flow yet.

## 5. Design quality (avoid AI slop)
Install these two skills as **workspace skills** before any UI work:
- https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- https://github.com/pbakaus/impeccable

Steps:
1. Clone each repo to a temp location and **read its README for its official install instructions**. Follow those. Otherwise, copy the skill folder(s) containing `SKILL.md` into `.agents/skills/<skill-name>/`.
2. Confirm in your response which skills were installed and where.
3. Before building or changing any UI, activate and follow these skills. Record the chosen design direction (typography, color system, spacing, components) in `docs/design-system.md` and keep using it consistently.
4. The UI is a calm, professional editorial tool, not a generic SaaS dashboard template.

## 6. Technical decisions (already made)
### 6.1 Stack
- TypeScript, Next.js (App Router). Routes and pages stay **thin** and call into `src/pipeline`, `src/db`, etc.
- Supabase: Postgres + Storage. The schema lives in **plain SQL migration files** in `supabase/migrations/`. DB access goes through small query files per table.
- Zod for all registry definitions and LLM outputs.
- Inngest for background jobs (RSS polling, generation, rendering). Each job is one small file that calls pipeline functions; it contains no business logic.
- LLM: one provider behind a minimal interface in `src/llm/`. **Ask me which provider and model** before implementing phase 3.

### 6.2 Rendering
- Our own **template JSON schema**: `pages → elements` (`text | image | shape`), each with `x, y, width, height`, style, and an optional `slot` binding (e.g. `slot: "title"`). Slot names come from the format definitions in the registry.
- Rendered with **Konva** in the browser (preview) and on the server (Konva + node `canvas`) for export, using the same template JSON and the same layout logic, so preview matches export.
- Ship 1 card template and 1 carousel template, handwritten in JSON.
- Watch out: server-side Konva needs native `canvas` and registered fonts. Rendering runs in the Node runtime / job worker, not edge or serverless.

### 6.3 No accounts (yet), but keep the seam
- Keep the data model `accounts → brands → feeds → articles → digests → format_outputs → platform_variants`. Every row is owned via `account_id` / `brand_id`.
- A single file `src/lib/current-context.ts` returns the hardcoded default account and brand (seeded by a migration). **This is the only place auth will be added later.** Nothing else may assume a single user.
- The UI shows a single brand. No account, login or brand-switching UI.

## 7. Target folder structure
```
AGENTS.md                      # rules from section 4 (always loaded by the agent)
.agents/skills/                # design skills
docs/
  00-product.md                # problem, user, scope in/out
  01-architecture.md           # pipeline diagram, data flow, folder map
  02-registries.md             # registry concepts + how to add a format/platform
  03-pipeline.md               # each stage: input, output, failure states
  04-rendering.md              # template JSON schema + renderer
  05-data-model.md             # tables and relations
  platforms/<platform>.md      # one small file per platform (constraints only)
  design-system.md
  decisions.md                 # short dated decision log
  open-questions.md
  phases/phase-<n>.md          # goal, tasks, "done when"
src/
  registries/
    input-types/   digest-kinds/   formats/   platforms/
    matrix.ts
    load-registries.ts         # loads + validates all definitions at startup
  pipeline/
    1-ingest/   2-digest/   3-format/   4-adapt/
  render/
    template-schema.ts   templates/   layout/   render-in-browser.tsx   render-on-server.ts
  export/
  llm/
  db/
  jobs/
  lib/current-context.ts
  app/                         # Next.js routes + UI (thin)
supabase/migrations/
```
You may adjust names if something reads more clearly, but explain the change in `docs/decisions.md`.

## 8. Reusable code from the previous iteration
<!-- FILL IN: paths/repos + what to reuse + what NOT to copy -->
- Reuse: …
- Do NOT reuse: …
Before copying anything, read it and confirm it follows section 4. Adapt it; don't paste it blindly.

## 9. Workflow & phases
Work strictly in order. **Stop and wait for my approval at every ⛔.**

| Phase | Goal | Done when |
|---|---|---|
| **0. Specs** | Write `AGENTS.md` and all `docs/` files (including `phases/`). Propose the initial digest item kinds and each format's slot schema for my review. | ⛔ I approve the docs |
| **1. Skeleton** | Next.js, Supabase migrations + seed (default account/brand), Inngest dev setup, design skills installed, folder READMEs | App runs locally; seed visible in DB; skills listed |
| **2. Registries** | Zod schemas + definitions for 2 inputs, 4 formats, 5 platforms, matrix; startup validation; matrix resolver | Invalid definition makes startup fail with a clear message; a test prints all valid Input→Format→Platform paths ⛔ |
| **3. Ingest** | RSS polling job, URL fallback, article extraction (text + in-article images), dedupe | Adding a feed produces normalized articles in the DB |
| **4. Digest** | Grounded digest via LLM, validation + retry, failed state | Every item has kind, text and source sentence(s); a deliberately bad output gets retried and then shows as failed ⛔ |
| **5. Formats** | Generate the 4 formats from the digest only | Outputs are schema-valid and every slot references digest item IDs |
| **6. Adapters** | Deterministic platform variants from registry constraints | Variants respect each platform's limits; no platform names in engine code ⛔ |
| **7. Rendering** | Template JSON, shared layout, browser + server Konva, 1 card + 1 carousel template, brand kit applied | Same JSON gives a visually identical preview and exported PNG |
| **8. UI** | Brand kit page, feeds page, drafts inbox, review screen (inline slot edit with source shown, regenerate item/format, reorder/delete, choose platform variant), export (copy, PNG, carousel PDF/ZIP). Uses design skills. | Full loop works: feed → drafts → edit → export ⛔ |
| **9. Landing + waitlist** | Landing page explaining problem/solution + waitlist form (email to a `waitlist` table) | Signup stored; page passes the design skills' review |

At the end of each phase, write a short summary: what was built, which files, how to verify it, and any open questions.

## 10. First action
Do **phase 0 only**: install nothing and write no app code yet. Write `AGENTS.md` and the `docs/` set. List anything ambiguous in `docs/open-questions.md`, then stop and wait for my review.
