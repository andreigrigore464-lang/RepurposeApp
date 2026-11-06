# src/llm/ — LLM Provider Interface

This directory wraps LLM model interactions behind an explicit, minimal TypeScript interface.

## Files
- `llm-provider.ts`: Generic `LlmProvider` contract and factory selector (`getLlmProvider()`).
- `groq-provider.ts`: Ultra-fast Groq completions implementation supporting models like `openai/gpt-oss-120b` and `qwen/qwen3.8-27b`.

## Responsibilities
- Provide a unified invocation contract for structured completion and JSON extraction.
- Isolate provider SDKs (Google Gemini, Groq, OpenAI) so swapping providers requires zero changes to pipeline stages.
- Manage bounded retry limits and structured error diagnostics for malformed or hallucinated responses.

