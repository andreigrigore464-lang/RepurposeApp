# AGENTS.md — Development Guidelines & Rules

This project is an article repurposing SaaS MVP. Every agent working in this repository must strictly adhere to the following rules at all times.

---

## Active Documentation & Single Source of Truth

- **Never consult legacy files in `docs/legacy/` for current requirements.** Those files represent the historical initial build and are archived.
- **Always read `docs/CURRENT_STATE.md` first** to understand the live state of the application and active architectural decisions.
- **Read domain specs on demand:** When working on a specific area, read only the relevant file in `docs/specs/` (`workflows-studio.md`, `pipeline-and-llm.md`) to conserve context tokens.

---

## 1. Intelligibility (The Core Rule)

Every file must be easy to open, read, understand, and debug.

1. **One file = one responsibility.**
   - File names state exactly what the file does (e.g., `fetch-rss-feed.ts`, not `utils.ts`).
   - No dumping grounds or catch-all files (`utils/`, `helpers/`, `misc/`, `common/`).
2. **Small files.**
   - Keep files compact. Try to make at maximum 350-450 lines per file. This should give you enough headspace but if it is more efficient for a feature to pass this number it is acceptable (otherwise it would create a mess).
   - Split by concrete responsibility, never arbitrarily.
3. **Plain functions over clever abstractions.**
   - No class hierarchies, no generic factories, no dependency injection containers, no metaprogramming.
   - Prefer boring, explicit, imperative code.
4. **Explicit data flow.**
   - Every pipeline stage is a plain TypeScript function with strictly typed input and output.
   - Any engineer should be able to follow an article from ingest to export simply by reading files in pipeline order.
5. **No barrel files.**
   - Never create `index.ts` files that merely re-export symbols.
   - Import directly from the concrete file that defines the symbol.
6. **Comments explain *why*.**
   - Every file begins with a 1–3 line comment header explaining what it does and where it sits in the pipeline / system.
   - Code comments clarify intent and domain rationale, not self-evident syntax.
7. **Readable logs at each stage boundary.**
   - Structured, human-readable logging at the boundary of each processing stage:
     `[digest] article=123 items=9 retries=0`
8. **Minimal dependencies.**
   - Before adding any npm package or external library, state why in `docs/decisions.md`.
9. **Each top-level folder has a short `README.md`.**
   - Explains its purpose and lists/describes the files in it.
10. **Errors are explicit.**
    - No silent `try/catch` suppression.
    - LLM output failures must be validated, retried up to a bounded limit, and stored as an explicit, visible failed state.

---

## 2. Anti-Hallucination & Grounding

### Product Level
- Every digest item stores the **exact source sentence(s)** from the source article.
- Format generation may **only** consume extracted digest items. No external web search, no fact enrichment, and no invented facts, numbers, or quotes.
- Every LLM output is validated against a Zod schema with a bounded retry limit.
- The review UI must display the grounding source sentence alongside every post, slide, or card.

### Agent Behavior Level
- **Do not invent requirements.** If the specification does not state something, ask the user or record it in `docs/open-questions.md`.
- **Do not claim something works without executing it.** Every phase must conclude with its "done when" criteria actually run and verified in the terminal/environment.
- **Do not refactor outside the current phase.** Keep edits scoped strictly to the task at hand.

---

## 3. The Registry Architecture Rule

- **The engine is generic.** Content flows through `Input -> Format -> Platform`.
- Inputs, digest item kinds, formats, platforms, and the matrix are **declarative registry files** validated with Zod at startup.
- Adding a format or platform means adding a single definition file, with **zero engine changes**.
- **Never hardcode a platform name, a format name, or a content field inside the engine.**
  If you are tempted to write `if (platform === "linkedin")` inside engine or pipeline code, stop. That rule belongs in the platform's declarative registry definition.

---

## 4. Content Rights & Images

- Images originate **only** from user brand kit uploads or from **inside the source article**.
- Never fetch images from external image APIs, stock libraries, or AI image generators.
- The maximum number of images extracted from an article is strictly bounded by the count of images physically present in the source article.
- Feeds maintain a `verification_status` column (defaulting to `unverified`). Do not build any automatic verification logic until specified.

---

## 5. Single-User / Multi-Tenant Seam

- The data model is strictly relational: `accounts -> brands -> feeds -> articles -> digests -> format_outputs -> platform_variants`.
- Every row is scoped to an `account_id` and `brand_id`.
- Authentication and account-switching UI are **out of scope** for this MVP.
- A single file, `src/lib/current-context.ts`, provides the hardcoded default `account_id` and `brand_id` seeded by a database migration.
- **This file is the single seam where authentication will later be injected.** No other code may assume a single user or bypass foreign keys.

---

## 6. Operational Discipline & Scope Control

- **Strict YAGNI & Scope Discipline:**
  - Implement only what is explicitly requested.
  - Never add speculative features, preemptive abstractions, or extra configuration options.
  - Before expanding scope or modifying files outside the immediate task, propose it and obtain explicit user consent.
  - Calibrate engineering depth to the project's current phase (lean, direct MVP code over enterprise plumbing). All work must be directly justifiable.
- **No Sycophancy & Root-Cause Remediation:**
  - Never apologize, flatter, or make polite excuses.
  - State the cause of an error plainly and deliver the fix directly.
  - Mistakes are technical signals: if an error was caused by conflicting, ambiguous, or missing instructions in `docs/` or `AGENTS.md`, identify the exact documentation gap and propose the specific update to prevent recurrence.

