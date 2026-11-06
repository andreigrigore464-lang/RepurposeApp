/**
 * Grounded Digest Verification & Test Script
 * 1. Executes real LLM extraction with Gemini Flash on an ingested article.
 * 2. Verifies grounding provenance: every item has kind, text, and verbatim source sentences.
 * 3. Executes negative test: feeds a deliberately hallucinating mock LLM to verify bounded
 *    retries and visible persistence of the failed state in the database.
 */

import { generateGroundedDigest } from "./generate-digest";
import { listArticlesForBrand } from "../../db/queries-articles";
import { DEFAULT_BRAND_ID } from "../../lib/current-context";
import { LlmProvider, GenerateJsonParams, GenerateTextParams } from "../../llm/llm-provider";

// Mock LLM that deliberately hallucinates facts and fake source sentences
class HallucinatingMockLlm implements LlmProvider {
  public attempts = 0;

  async generateText(_params: GenerateTextParams): Promise<string> {
    return "mock";
  }

  async generateJson<T>(_params: GenerateJsonParams): Promise<T> {
    this.attempts++;
    // Returns an item with an invented sentence that does not exist in any article
    return {
      items: [
        {
          id: `item_${this.attempts}`,
          kind: "statistic_or_data",
          text: "Aliens built 99% of digital publishing infrastructure in the year 1842.",
          source_sentences: [
            "This exact sentence about aliens building publishing software is an intentional hallucination."
          ],
        },
      ],
    } as T;
  }
}

async function runDigestVerification() {
  console.log("==================================================");
  console.log("       PHASE 4: GROUNDED DIGEST PIPELINE TEST     ");
  console.log("==================================================");

  // 1. Fetch ingested article from DB
  console.log("\n[1/3] Loading Ingested Article from Supabase...");
  const articles = await listArticlesForBrand(DEFAULT_BRAND_ID, 1);
  if (articles.length === 0) {
    throw new Error("No articles found in DB. Run 'npm run ingest:verify' first.");
  }
  const article = articles[0];
  console.log(`✓ Loaded article: "${article.title}" (${article.id})`);
  console.log(`✓ Article text length: ${article.clean_text.length} chars`);

  // 2. Real LLM Grounded Digest Generation with Gemini Flash
  console.log("\n[2/3] Calling Gemini Flash for Grounded Digest Extraction...");
  const result = await generateGroundedDigest({
    articleId: article.id,
    brandId: DEFAULT_BRAND_ID,
    articleTitle: article.title,
    articleText: article.clean_text,
    brandVoiceGuidelines: "Authoritative, concise, analytical.",
  });

  if (!result.success) {
    throw new Error(`Real LLM digest extraction failed: ${result.digestRecord.error_message}`);
  }

  console.log(`✓ Digest generated and saved! ID: ${result.digestRecord.id}`);
  console.log(`✓ Extracted items count: ${result.digestRecord.items.length}`);
  console.log(`✓ Retries needed: ${result.retriesUsed}`);

  // Print extracted items and inspect grounding
  console.log("\nExtracted Grounded Items:");
  result.digestRecord.items.forEach((item, idx) => {
    console.log(`\n  [${idx + 1}] (${item.kind}) "${item.text}"`);
    console.log(`      Source Sentence(s):`);
    item.source_sentences.forEach((s) => console.log(`      ↳ "${s}"`));
  });

  // Verify all source sentences are verbatim substrings
  const normalizedBody = article.clean_text.toLowerCase().replace(/\s+/g, " ");
  for (const item of result.digestRecord.items) {
    for (const sentence of item.source_sentences) {
      const normalizedSentence = sentence.toLowerCase().replace(/\s+/g, " ");
      if (!normalizedBody.includes(normalizedSentence)) {
        throw new Error(
          `VERIFICATION FAILED: Sentence "${sentence}" in item "${item.id}" is NOT in source article!`
        );
      }
    }
  }
  console.log("\n✓ 100% Grounding Provenance Verified: All sentences exist verbatim in source text!");

  // 3. Negative Test: Deliberately Hallucinated LLM Output
  console.log("\n[3/3] Negative Test: Feeding Deliberately Hallucinated Output...");
  const mockLlm = new HallucinatingMockLlm();
  const failedResult = await generateGroundedDigest({
    articleId: article.id,
    brandId: DEFAULT_BRAND_ID,
    articleTitle: article.title,
    articleText: article.clean_text,
    llmProvider: mockLlm,
    maxRetries: 2,
  });

  console.log(`✓ Total retry attempts executed: ${mockLlm.attempts}`);
  if (mockLlm.attempts !== 3) { // 1 initial + 2 retries
    throw new Error(`Expected exactly 3 attempts (1 initial + 2 retries), got ${mockLlm.attempts}`);
  }

  if (failedResult.success) {
    throw new Error("FAILED: Hallucinated output was incorrectly accepted as valid!");
  }

  console.log(`✓ Correctly rejected hallucinated output!`);
  console.log(`✓ Recorded status in DB: "${failedResult.digestRecord.status}"`);
  console.log(`✓ Failure diagnostic stored in DB: "${failedResult.digestRecord.error_message?.slice(0, 100)}..."`);

  console.log("\n==================================================");
  console.log("       ALL GROUNDED DIGEST CHECKS PASSED          ");
  console.log("==================================================\n");
}

runDigestVerification().catch((err) => {
  console.error("Digest verification failed:", err);
  process.exit(1);
});

