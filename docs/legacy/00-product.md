# 00 — Product Specification: Article Repurposing SaaS

## 1. Problem & Audience

### Target Audience
- **Small-to-mid digital publishers** (2–15 team members).
- Publishing several editorial articles per week.
- Operating without a dedicated full-time social media manager or content agency.

### Problem
Publishers need their editorial content distributed across social platforms (LinkedIn, X, Instagram, Facebook, Threads) to build readership and engagement. However:
1. Repurposing articles manually into various platform formats is time-consuming and tedious.
2. Direct AI generation produces hallucinations, stylistic drift, and disconnected summaries that damage editorial reputation.
3. Publishers refuse to let an autonomous bot auto-post unchecked content to their brand channels.

### Solution
An editorial repurposing tool that takes an article (via RSS feed polling or pasted URL fallback) and transforms it into platform-ready social content.
- **Strict Grounding:** Every extracted item traces back to verifiable source sentences from the article.
- **Brand Consistency:** Applied visual style and voice guidelines from a manual brand kit.
- **Human-in-the-Loop Review:** The user reviews, edits, and exports the final copy and assets.
- **No Direct Posting:** The app never posts to social networks directly. It produces clean copy and downloadable assets (images, carousel PDFs/ZIPs).

---

## 2. Scope Boundaries

### In Scope for MVP
- **Ingestion:**
  - RSS feed background polling via Inngest.
  - Manual URL fallback input.
  - Article extraction (full text, metadata, in-article image extraction).
  - Deduplication of incoming articles.
- **Processing (Pipeline & Matrix):**
  - Grounded digest generation via LLM (fact extraction with exact sentence provenance).
  - Format generation (platform-agnostic shapes: `text-post`, `thread`, `card`, `carousel`).
  - Platform packaging adapters (constraints applied at the end for LinkedIn, X, Instagram, Facebook, Threads).
- **Branding & Rendering:**
  - Manual brand kit (palette, typography, logo, brand tone rules).
  - JSON-based declarative canvas template rendering (Konva in browser and server Node canvas).
  - 1 card template and 1 carousel template.
- **User Interface & Operations:**
  - Drafts inbox with status tracking.
  - Review screen with side-by-side grounded source sentences, inline slot editing, regenerate options, and variant preview.
  - Multi-format asset export (clipboard copy, PNG image download, carousel PDF/ZIP export).
  - Landing page with simple waitlist submission form.

### Out of Scope (Do NOT Build or Scaffold)
- **User Accounts & Authentication:** No signup, login, session cookies, password reset, or OAuth. (Preserve the single seam in `src/lib/current-context.ts`).
- **Direct Publishing & Platform OAuth:** No Facebook Graph API, LinkedIn API, or X API posting integrations.
- **Scheduling:** No publish calendar or queue schedulers.
- **Video & Reels:** No video generation or editing in the matrix.
- **Visual Template Designer / Editor UI:** Templates are defined in JSON code; no drag-and-drop canvas editor.
- **AI Image Generation / Stock Search:** Zero third-party image generation (no DALL-E, Midjourney, Unsplash). Images are strictly sourced from the article itself or brand kit uploads.
- **Automated Brand Voice Inference:** No automatic scraping or AI guessing of brand guidelines; brand settings are manually configured.
- **Multi-Brand UI / Teams / Roles:** Single brand view only.
- **Billing & Subscriptions:** No Stripe, checkout, or paywalls.
- **Analytics & Tracking:** No post-performance tracking.

