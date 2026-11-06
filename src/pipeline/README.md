# src/pipeline/ — Processing Pipeline Stages

This directory contains the sequential, strictly typed stages that transform raw articles into grounded, platform-ready variants.

## Pipeline Stages
- `1-ingest/` — RSS feed fetchers, HTML article extractors, image collectors, and text-hash deduplicators.
- `2-digest/` — LLM-driven grounded fact extraction with verbatim sentence provenance and schema validation.
- `3-format/` — Slot synthesis mapping grounded digest items into platform-agnostic format objects.
- `4-adapt/` — Pure TypeScript deterministic adapters applying platform constraints (length, hashtags, packaging).

