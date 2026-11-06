/**
 * Groq LLM Provider Implementation
 * Provides ultra-fast inference via Groq's OpenAI-compatible completions API with strict timeouts and 429 TPM backoff.
 * System Layer: llm
 */

import {
  LlmProvider,
  GenerateTextParams,
  GenerateJsonParams,
} from "./llm-provider";

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 90000,
  operationName = "Groq LLM generation"
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

function parseRetryDelayMs(res: Response, errorText: string): number {
  const retryHeader = res.headers.get("retry-after");
  if (retryHeader) {
    const parsed = parseFloat(retryHeader);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(Math.ceil(parsed * 1000) + 1500, 30000);
    }
  }
  const match = errorText.match(/try again in ([0-9.]+)s/i);
  if (match) {
    const seconds = parseFloat(match[1]);
    if (!isNaN(seconds) && seconds > 0) {
      return Math.min(Math.ceil(seconds * 1000) + 1500, 30000);
    }
  }
  return 8000;
}

async function fetchGroqWithBackoff(
  url: string,
  body: Record<string, unknown>,
  apiKey: string,
  maxRetries = 3
): Promise<any> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return res.json();
    }

    const errorText = await res.text();
    if (res.status === 429 && attempt < maxRetries) {
      const waitMs = parseRetryDelayMs(res, errorText);
      console.warn(
        `[groq:rate-limit] 429 TPM limit hit. Backing off for ${Math.round(
          waitMs / 1000
        )}s before retry ${attempt + 1}/${maxRetries}...`
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt++;
      continue;
    }

    throw new Error(`Groq API error (${res.status}): ${errorText}`);
  }
}

function cleanJsonContent(rawText: string): string {
  let text = rawText.trim();
  // Strip ```json and ``` markdown code fences if present
  if (text.startsWith("```json")) {
    text = text.slice(7);
  } else if (text.startsWith("```")) {
    text = text.slice(3);
  }
  if (text.endsWith("```")) {
    text = text.slice(0, -3);
  }
  return text.trim();
}

export class GroqLlmProvider implements LlmProvider {
  private apiKey: string;
  private modelName: string;
  private baseUrl: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error("Missing GROQ_API_KEY in environment");
    }
    this.apiKey = key;
    this.modelName = modelName || process.env.GROQ_MODEL || "openai/gpt-oss-120b";
    this.baseUrl = "https://api.groq.com/openai/v1/chat/completions";
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    const timeoutMs = params.timeoutMs ?? 90000;
    const messages: Array<{ role: "system" | "user"; content: string }> = [];

    if (params.systemInstruction) {
      messages.push({ role: "system", content: params.systemInstruction });
    }
    messages.push({ role: "user", content: params.prompt });

    const callPromise = fetchGroqWithBackoff(
      this.baseUrl,
      {
        model: this.modelName,
        messages,
        temperature: params.temperature ?? 0.2,
      },
      this.apiKey
    );

    const response = await withTimeout(
      callPromise,
      timeoutMs,
      `Groq generateText (${this.modelName})`
    );

    const text = response.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Groq returned empty text response");
    }
    return text.trim();
  }

  async generateJson<T>(params: GenerateJsonParams): Promise<T> {
    const timeoutMs = params.timeoutMs ?? 90000;
    const messages: Array<{ role: "system" | "user"; content: string }> = [];

    if (params.systemInstruction) {
      messages.push({
        role: "system",
        content: `${params.systemInstruction}\n\nIMPORTANT: You must output ONLY a valid JSON object.`,
      });
    }
    messages.push({ role: "user", content: params.prompt });

    const callPromise = fetchGroqWithBackoff(
      this.baseUrl,
      {
        model: this.modelName,
        messages,
        temperature: params.temperature ?? 0.1,
        response_format: { type: "json_object" },
      },
      this.apiKey
    );

    const response = await withTimeout(
      callPromise,
      timeoutMs,
      `Groq generateJson (${this.modelName})`
    );

    const rawText = response.choices?.[0]?.message?.content;
    if (!rawText) {
      throw new Error("Groq returned empty JSON response");
    }

    const cleanedText = cleanJsonContent(rawText);
    try {
      return JSON.parse(cleanedText) as T;
    } catch (err) {
      throw new Error(
        `Failed to parse Groq response as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw response: ${rawText}`
      );
    }
  }
}
