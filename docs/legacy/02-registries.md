# 02 — Registries, Formats & The Matrix

## 1. Registry Architecture Concept

The engine never contains hardcoded domain knowledge about platforms, formats, or input types.
Instead, all domain entities are declared as configuration objects validated at application startup using Zod schemas.

### Registry Directories
- `src/registries/input-types/` — Declarations of ingest sources (`rss`, `manual-url`).
- `src/registries/digest-kinds/` — Semantic categories of factual digest items extracted from articles.
- `src/registries/formats/` — Platform-agnostic content shapes with defined slot schemas.
- `src/registries/platforms/` — Destination constraints, limits, and packaging rules.
- `src/registries/matrix.ts` — Permissible routes connecting `Input -> Format` and `Format -> Platform`.

---

## 2. Proposed Initial Digest Item Kinds

Every item produced by the Digest LLM stage belongs to one of these kinds. Every item **must** include its verbatim source sentence(s) from the source article.

| Kind | Description | Example Content |
|---|---|---|
| `core_thesis` | The central argument or fundamental message of the article. | "Digital publishing workflows without structured grounding consistently suffer from factual hallucination." |
| `key_takeaway` | An actionable lesson, summary point, or high-level conclusion. | "Separating content format from social platform packaging prevents exponential engine complexity." |
| `statistic_or_data` | A quantitative fact, metric, benchmark, or percentage directly stated in the text. | "Publishers spend an average of 4.2 hours per article manually formatting social cross-posts." |
| `direct_quote` | A notable quote attributed to an individual or source explicitly named in the text. | "'Boring, explicit code is ten times easier to debug when an LLM fails.' — Lead Architect" |
| `counter_intuitive_insight` | A surprising contrast, myth-buster, or non-obvious realization. | "AI social media tools that auto-post without human review suffer an 80% higher brand attrition rate." |
| `problem_context` | A description of the pain point or existing landscape that prompted the article. | "Small digital publishers lack dedicated social teams, forcing editors to split time between writing and distribution." |
| `solution_example` | A concrete use case, scenario, or historical example cited in the article. | "An independent magazine increased its article reach by 3x by breaking long reads into 5-slide carousels." |

---

## 3. Proposed Format Slot Schemas (The 4 MVP Formats)

Each format defines an exact Zod slot schema. The LLM Format stage populates these slots using *only* items extracted in the Digest stage.

### 1. `text-post` (Single standalone social post)
- `hook` (`string`, 50–180 chars): A compelling opening line to stop the scroll.
- `body_paragraphs` (`string[]`, 1–4 items, each 80–300 chars): Clear elaboration grounded in digest points.
- `takeaway` (`string`, 50–200 chars): The primary conclusion or distillation.
- `call_to_action` (`string`, 20–120 chars): Prompt to read the full article or reflect.
- `source_item_ids` (`string[]`): Digest item IDs referenced by this format.

### 2. `thread` (Multi-part sequential post series)
- `hook_post` (`string`, 100–250 chars): The initial post establishing the topic and compelling hook.
- `body_posts` (`string[]`, 2–7 items, each 120–260 chars): Sequential breakdown of core points or takeaways.
- `conclusion_post` (`string`, 80–220 chars): Summary of the thesis.
- `call_to_action_post` (`string`, 50–180 chars): Final link-in-bio or read-more instruction.
- `source_item_ids` (`string[]`): Digest item IDs referenced across the thread.

### 3. `card` (Single standalone graphic image with text overlay)
- `kicker` (`string`, 10–35 chars): Category or topic tag (e.g., "EDITORIAL INSIGHT").
- `headline` (`string`, 25–100 chars): High-impact bold title.
- `subhead` (`string`, optional, 40–160 chars): Supporting explanatory statement or statistic.
- `stat_callout` (`string`, optional, 3–15 chars): Prominent figure if applicable (e.g., "3.5x", "74%").
- `attribution` (`string`, 10–50 chars): Source publication or author credit line.
- `source_item_ids` (`string[]`): Digest item IDs backing the card text.

### 4. `carousel` (Multi-slide visual presentation: PDF / multi-image)
- `cover_slide`:
  - `kicker` (`string`, 10–35 chars): Top badge/category.
  - `title` (`string`, 20–80 chars): Main topic headline.
  - `subtitle` (`string`, 40–140 chars): Context hook.
- `body_slides` (`array`, 3–8 slides):
  - `slide_number` (`number`): Sequential 1-based index.
  - `title` (`string`, 15–60 chars): Slide focal header.
  - `body` (`string`, 60–220 chars): Grounded breakdown point.
  - `badge` (`string`, optional, 5–25 chars): Visual tag or step label (e.g., "Step 01", "Key Stat").
- `closing_slide`:
  - `title` (`string`, 15–60 chars): Final takeaway headline.
  - `summary` (`string`, 50–160 chars): Concluding thought.
  - `call_to_action` (`string`, 20–100 chars): Read article / brand prompt.
- `source_item_ids` (`string[]`): Digest item IDs mapped across all slides.

---

## 4. Platform Definitions (Destination Constraints)

Platforms do not define content; they define **boundary constraints** and **packaging**:

| Platform | Max Chars | Hashtag Policy | Max Images | Carousel Support | Special Notes |
|---|---|---|---|---|---|
| **LinkedIn** | 3,000 | 3–5 at end | 9 (or PDF document) | Yes (PDF document upload) | First 210 chars appear before "...see more". |
| **X (Twitter)** | 280 (per post) | 0–2 inline/end | 4 per tweet | Thread structure (not native PDF) | Hard 280 character limit per thread item. |
| **Instagram** | 2,200 | 3–10 at bottom | 10 per carousel | Yes (multi-image sequence 1080x1350 or 1080x1080) | Links in caption are not clickable (needs CTA). |
| **Facebook** | 5,000 | 0–2 optional | 10 per album | Multi-image album | First ~400 characters visible before fold. |
| **Threads** | 500 (per post) | 0–1 tagged topic | 10 per post | Thread or multi-image carousel | 500 char limit per post segment. |

---

## 5. The Matrix Definition

The matrix explicitly maps which pipeline paths are permissible:

```typescript
// Conceptual structure in src/registries/matrix.ts
export const MATRIX_INPUT_TO_FORMAT = {
  "rss": ["text-post", "thread", "card", "carousel"],
  "manual-url": ["text-post", "thread", "card", "carousel"],
};

export const MATRIX_FORMAT_TO_PLATFORM = {
  "text-post": ["linkedin", "x", "instagram", "facebook", "threads"],
  "thread": ["x", "threads"],
  "card": ["linkedin", "x", "instagram", "facebook", "threads"],
  "carousel": ["linkedin", "instagram"], // LinkedIn as document, Instagram as image sequence
};
```

---

## 6. How to Add a New Format or Platform (Zero Engine Changes)

### Adding a New Format (e.g., `quote-graphic`):
1. Create `src/registries/formats/quote-graphic.ts`:
   - Define its slot Zod schema (`quoteText`, `author`, `publicationDate`).
   - Define prompt guidance for slot extraction.
2. Register it in `src/registries/formats/all-formats.ts`.
3. Add allowed pairings in `src/registries/matrix.ts`.
4. Startup validation automatically ensures schemas and matrix links are sound.

### Adding a New Platform (e.g., `bluesky`):
1. Create `src/registries/platforms/bluesky.ts`:
   - Declare constraints: `maxChars: 300`, `allowedFormats: ["text-post", "thread", "card"]`.
   - Declare packaging rules (e.g., thread splitting rules).
2. Register in `src/registries/platforms/all-platforms.ts`.
3. Add valid format links in `src/registries/matrix.ts`.
4. The generic pipeline will immediately support Bluesky export without touching any pipeline code.

