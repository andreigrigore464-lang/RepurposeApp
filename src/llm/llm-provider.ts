/**
 * Minimal LLM Provider Interface & Gemini Implementation
 * Wraps LLM calls behind an isolated, provider-agnostic interface with strict timeouts.
 * System Layer: llm
 */

import { GoogleGenAI } from "@google/genai";
import { GroqLlmProvider } from "./groq-provider";

export interface GenerateTextParams {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface GenerateJsonParams {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface LlmProvider {
  generateText(params: GenerateTextParams): Promise<string>;
  generateJson<T>(params: GenerateJsonParams): Promise<T>;
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 45000,
  operationName = "LLM generation"
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

export class GeminiLlmProvider implements LlmProvider {
  private client: GoogleGenAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Missing GEMINI_API_KEY in environment");
    }
    this.client = new GoogleGenAI({ apiKey: key });
    this.modelName = modelName || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  async generateText(params: GenerateTextParams): Promise<string> {
    const timeoutMs = params.timeoutMs ?? 60000;
    const callPromise = this.client.models.generateContent({
      model: this.modelName,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.2,
      },
    });

    const response = await withTimeout(callPromise, timeoutMs, `Gemini generateText (${this.modelName})`);
    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty text response");
    }
    return text.trim();
  }

  async generateJson<T>(params: GenerateJsonParams): Promise<T> {
    const timeoutMs = params.timeoutMs ?? 60000;
    const callPromise = this.client.models.generateContent({
      model: this.modelName,
      contents: params.prompt,
      config: {
        systemInstruction: params.systemInstruction,
        temperature: params.temperature ?? 0.1,
        responseMimeType: "application/json",
      },
    });

    const response = await withTimeout(callPromise, timeoutMs, `Gemini generateJson (${this.modelName})`);
    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned empty JSON response");
    }

    try {
      return JSON.parse(text) as T;
    } catch (err) {
      throw new Error(
        `Failed to parse Gemini response as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw response: ${text}`
      );
    }
  }
}

// Default singleton instance
let defaultProvider: LlmProvider | null = null;

export function getLlmProvider(): LlmProvider {
  if (!defaultProvider) {
    const providerName =
      process.env.LLM_PROVIDER?.toLowerCase() ||
      (process.env.GROQ_API_KEY ? "groq" : "gemini");

    if (providerName === "groq") {
      const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
      console.log(`[llm] Initialized Groq LLM Provider (model: ${model})`);
      defaultProvider = new GroqLlmProvider();
    } else {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      console.log(`[llm] Initialized Gemini LLM Provider (model: ${model})`);
      defaultProvider = new GeminiLlmProvider();
    }
  }
  return defaultProvider!;
}
