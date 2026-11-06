/**
 * Content Routing Matrix
 * Declares permitted Input -> Format and Format -> Platform connections.
 * Provides matrix resolution functions for the generic engine.
 */

import { MatrixDefinition, MatrixPath } from "./types";

export const MATRIX_DEFINITION: MatrixDefinition = {
  inputToFormats: {
    "rss": ["text-post", "thread", "card", "carousel"],
    "manual-url": ["text-post", "thread", "card", "carousel"],
  },
  formatToPlatforms: {
    "text-post": ["linkedin", "x", "instagram", "facebook", "threads"],
    "thread": ["x", "threads"],
    "card": ["linkedin", "x", "instagram", "facebook", "threads"],
    "carousel": ["linkedin", "instagram"],
  },
};

/**
 * Returns the list of permitted format IDs for a given input source ID.
 */
export function getAllowedFormatsForInput(inputId: string): string[] {
  return MATRIX_DEFINITION.inputToFormats[inputId] || [];
}

/**
 * Returns the list of permitted platform IDs for a given format ID.
 */
export function getAllowedPlatformsForFormat(formatId: string): string[] {
  return MATRIX_DEFINITION.formatToPlatforms[formatId] || [];
}

/**
 * Checks if a specific Input -> Format pair is allowed.
 */
export function isInputFormatAllowed(inputId: string, formatId: string): boolean {
  const allowed = MATRIX_DEFINITION.inputToFormats[inputId];
  return Boolean(allowed && allowed.includes(formatId));
}

/**
 * Checks if a specific Format -> Platform pair is allowed.
 */
export function isFormatPlatformAllowed(formatId: string, platformId: string): boolean {
  const allowed = MATRIX_DEFINITION.formatToPlatforms[formatId];
  return Boolean(allowed && allowed.includes(platformId));
}

/**
 * Computes all permissible paths through the entire matrix:
 * Input -> Format -> Platform.
 */
export function getAllMatrixPaths(): MatrixPath[] {
  const paths: MatrixPath[] = [];

  for (const [inputId, formats] of Object.entries(MATRIX_DEFINITION.inputToFormats)) {
    for (const formatId of formats) {
      const platforms = MATRIX_DEFINITION.formatToPlatforms[formatId] || [];
      for (const platformId of platforms) {
        paths.push({
          input: inputId,
          format: formatId,
          platform: platformId,
        });
      }
    }
  }

  return paths;
}

