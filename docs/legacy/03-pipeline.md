# 03 — Pipeline Specification & Failure Modes

## 1. Pipeline Principles

1. **Deterministic Boundaries:** Every stage is an isolated, pure-input/pure-output TypeScript function.
2. **Explicit Data Flow:** You can trace an article from ingest to export simply by following stage function calls in sequence.
3. **No Silent Failures:** Any error (network failure, parsing error, LLM schema violation, canvas render fault) is caught, logged with readable context, and stored in the database with a visible `failed` state.
4. **Structured Logging:** Every boundary outputs a standardized log format:
   `[stage-name] id=<entity_id> status=<success|retry|failed> detail=<details>`

---

## 2. Stage Breakdown

### Stage 1: Ingestion (`src/pipeline/1-ingest/`)
- **Inputs:**
  - RSS feed URL or pasted single article URL.
  - Brand context (`account_id`, `brand_id`).
- **Processing:**
  - Fetch feed XML or direct HTML document with strict timeout (10s).
  - Parse article text using Readability/Cheerio to strip ads, navigation, and boilerplate.
  - Extract in-article image URLs (strictly from `<img>` elements inside the parsed article body).
  - Deduplicate using canonical URL and SHA-256 hash of article body text.
- **Outputs:**
  - Stored record in `articles` table: `id`, `brand_id`, `feed_id` (nullable), `canonical_url`, `title`, `author`, `published_at`, `raw_html`, `clean_text`, `image_urls[]`, `status: "ingested"`.
- **Failure States & Handling:**
  - *Network unreachable / 404 / 500:* Log `[ingest] url=<url> error=network_unreachable`, mark feed item / article as `failed_ingest`.
  - *Paywall / Empty content:* If extracted text is under 150 words, fail with `content_too_short`.
  - *No in-article images:* Valid state; sets `image_urls: []`. No fallback to stock images.

---

### Stage 2: Grounded Digest (`src/pipeline/2-digest/`)
- **Inputs:**
  - Extracted article `clean_text` and `title`.
  - Brand voice guidelines (tonal keywords, target audience).
- **Processing:**
  - LLM extracts 5–15 atomic factual items matching defined `digest-kinds` (`core_thesis`, `key_takeaway`, `statistic_or_data`, etc.).
  - **Strict Anti-Hallucination Rule:** Every item must include an array of `source_sentences` verbatim from the article text.
  - The engine validates every item against the Zod schema and verifies that `source_sentences` exist as substring matches in `clean_text`.
- **Outputs:**
  - Stored record in `digests` table with an array of structured items:
    ```typescript
    interface DigestItem {
      id: string; // "item_1", "item_2", ...
      kind: DigestKind;
      text: string;
      source_sentences: string[];
    }
    ```
- **Failure States & Retry:**
  - *Zod Schema Violation or Missing Source Sentence:* Bounded retry up to 2 times with explicit feedback to the LLM (e.g., "The quote in item 3 was not found verbatim in the provided text. Extract verbatim sentences only.").
  - *Exhausted Retries:* Log `[digest] article=123 retries=2 status=failed`, update article status to `failed_digest` with error diagnostic message.

---

### Stage 3: Format Synthesis (`src/pipeline/3-format/`)
- **Inputs:**
  - Stored `digests` record (array of validated `DigestItem`).
  - Target format definition from registry (`text-post`, `thread`, `card`, `carousel`).
- **Processing:**
  - LLM takes the digest items and maps/synthesizes them into the format's required slots.
  - Format generation may **only** reference and reshape data present in the digest.
  - Output slot data includes `source_item_ids` to maintain an unbroken provenance chain back to the digest items (and therefore to the article sentences).
  - Validated against the format's Zod schema.
- **Outputs:**
  - Stored record in `format_outputs` table: `id`, `article_id`, `digest_id`, `format_kind`, `slots_data` (JSON), `status: "generated"`.
- **Failure States & Retry:**
  - *Slot constraint violation (e.g., hook too long, missing required slide):* Bounded retry (max 2 attempts).
  - *Exhausted Retries:* Stored with `status: "failed"` and error details visible in the UI inbox.

---

### Stage 4: Platform Adaptation (`src/pipeline/4-adapt/`)
- **Inputs:**
  - Validated `format_outputs` record.
  - Platform registry definition (`linkedin`, `x`, `instagram`, `facebook`, `threads`).
- **Processing:**
  - **Deterministic, pure TypeScript code only (No LLM).**
  - Truncates or formats text according to platform character limits and conventions.
  - Applies hashtag rules (e.g., appends brand hashtags if permitted, strips hashtags if platform disallowed).
  - Packages slides into platform-specific structures (e.g., PDF for LinkedIn, image list for Instagram).
- **Outputs:**
  - Stored record in `platform_variants` table: `id`, `format_output_id`, `platform_id`, `adapted_text`, `media_spec`, `validation_warnings[]`.
- **Failure States & Handling:**
  - If a format cannot logically satisfy a platform's hard constraint (e.g., thread with 25 tweets on a platform capped at 10), record returns `is_supported: false` with explanatory warning; never crashes.

---

### Stage 5: Render & Export (`src/render/` & `src/export/`)
- **Inputs:**
  - `platform_variants` or `format_outputs` slot data.
  - Brand kit styling (primary font, secondary font, brand color, background color, logo URL).
  - Handcrafted template JSON (`card` or `carousel`).
- **Processing:**
  - **Browser Preview:** Rendered interactively using Konva in a React canvas component.
  - **Server Render:** Rendered using Konva backed by Node `canvas` to generate raw image buffers.
  - Layout calculations and font metrics are shared between browser and server to guarantee pixel parity.
- **Outputs:**
  - Copyable plain text clipboard content.
  - High-res PNG image(s).
  - Multi-page PDF (for LinkedIn document carousels) or ZIP archive of images.
- **Failure States & Handling:**
  - *Missing font / image load failure:* Catches error, falls back to safe system fonts (Inter / Roboto) and logs `[render] template=card fallback_font=true`.

