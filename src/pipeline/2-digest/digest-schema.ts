/**
 * Grounded Digest Zod Schema & Types
 * Defines the strict structure of atomic factual items extracted by the LLM.
 * Pipeline Stage: 2-digest
 */

import { z } from "zod";

export const DigestItemSchema = z.object({
  id: z.string().min(1),
  kind: z.string().min(1),
  text: z.string().min(15).max(400),
  source_sentences: z.array(z.string().min(10)).min(1),
});

export type DigestItem = z.infer<typeof DigestItemSchema>;

export const GroundedDigestSchema = z.object({
  items: z.array(DigestItemSchema).min(3).max(15),
});

export type GroundedDigest = z.infer<typeof GroundedDigestSchema>;

