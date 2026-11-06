# Open Questions & Clarifications

This document records ambiguities and decisions reached with the user.

---

## 1. LLM Provider & Target Model — [RESOLVED]
- **Decision:** Use a free/low-cost model for initial development and testing (Google Gemini Flash), keeping the LLM client strictly abstracted behind `src/llm/` so models/providers can be swapped seamlessly later.

---

## 2. Supabase Environment — [RESOLVED]
- **Decision:** Cloud Supabase project directly (no local Docker). Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) stored in `.env.local`. Plain SQL migrations tracked in `supabase/migrations/`.

---

## 3. In-Article Image Storage — [RESOLVED]
- **Decision:** Extracted images will be downloaded and cached in Supabase Storage (`article-images` bucket) during ingest to prevent CORS canvas tainting and hotlinking issues. Future migration path to Cloudinary recorded for when higher storage volume is required.

---

## 4. Reusable Code from Previous Iteration — [RESOLVED]
- **Decision:** Build entirely from scratch. Fresh start.

---

## 5. Font Assets & Legal Constraints — [RESOLVED]
- **Decision:** Bundle open-source SIL-licensed fonts (`Inter` and `Playfair Display`) as `.ttf` files directly in `public/fonts/`. Loaded via `@font-face` on client and `registerFont()` on Node server. Custom user font uploads are explicitly disallowed in the MVP to eliminate font copyright liability.

---

## 6. Feed Verification Status Display — [RESOLVED]
- **Decision:** In Phase 8, display a subtle read-only status badge (e.g., `Unverified`) next to each feed. No automated verification logic until specified.
