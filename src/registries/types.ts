/**
 * Registry Base Types & Schemas
 * Core TypeScript types and Zod schemas for the declarative registry system.
 * Governs inputs, digest kinds, formats, platforms, and matrix routes.
 */

import { z } from "zod";

// 1. Input Type Definition
export const InputTypeDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  requiresUrl: z.boolean(),
  supportsPolling: z.boolean(),
});
export type InputTypeDefinition = z.infer<typeof InputTypeDefinitionSchema>;

// 2. Digest Kind Definition
export const DigestKindDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  extractionPromptGuidance: z.string().min(1),
  typicalLengthRange: z.object({
    minChars: z.number().int().positive(),
    maxChars: z.number().int().positive(),
  }),
});
export type DigestKindDefinition = z.infer<typeof DigestKindDefinitionSchema>;

// 3. Format Definition
export const FormatDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  mediaType: z.enum(["text-only", "single-image", "multi-image-or-pdf"]),
  slotSchema: z.instanceof(z.ZodObject),
  promptTemplateGuidance: z.string().min(1),
});
export type FormatDefinition = z.infer<typeof FormatDefinitionSchema>;

// 4. Platform Definition
export const PlatformConstraintSchema = z.object({
  maxCharacters: z.number().int().positive(),
  visibleFoldCharacters: z.number().int().positive().optional(),
  hashtagPolicy: z.object({
    minCount: z.number().int().min(0),
    maxCount: z.number().int().positive(),
    placement: z.enum(["inline", "end-of-post", "first-comment-or-end", "disallowed"]),
  }),
  mediaCapabilities: z.object({
    supportsSingleImage: z.boolean(),
    supportsThread: z.boolean(),
    supportsCarouselPdf: z.boolean(),
    supportsImageSequence: z.boolean(),
    maxImageCount: z.number().int().min(0),
  }),
  formattingRules: z.object({
    supportsClickableLinks: z.boolean(),
    linkCharBudgetCost: z.number().int().min(0).optional(),
    paragraphSeparator: z.string(),
  }),
});
export type PlatformConstraints = z.infer<typeof PlatformConstraintSchema>;

export const PlatformDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  constraints: PlatformConstraintSchema,
});
export type PlatformDefinition = z.infer<typeof PlatformDefinitionSchema>;

// 5. Matrix Route Definition
export const MatrixDefinitionSchema = z.object({
  inputToFormats: z.record(z.string(), z.array(z.string())),
  formatToPlatforms: z.record(z.string(), z.array(z.string())),
});
export type MatrixDefinition = z.infer<typeof MatrixDefinitionSchema>;

// Resolved path across the full pipeline
export interface MatrixPath {
  input: string;
  format: string;
  platform: string;
}

