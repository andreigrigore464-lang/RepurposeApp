/**
 * Registry Loader & Validator
 * Validates all registered inputs, digest kinds, formats, platforms, and matrix routes at startup.
 * Throws explicit, structured errors if any schema or cross-reference check fails.
 */

import { ALL_INPUTS } from "./input-types/all-inputs";
import { ALL_DIGEST_KINDS } from "./digest-kinds/all-digest-kinds";
import { ALL_FORMATS } from "./formats/all-formats";
import { ALL_PLATFORMS } from "./platforms/all-platforms";
import { MATRIX_DEFINITION } from "./matrix";
import {
  InputTypeDefinition,
  InputTypeDefinitionSchema,
  DigestKindDefinition,
  DigestKindDefinitionSchema,
  FormatDefinition,
  FormatDefinitionSchema,
  PlatformDefinition,
  PlatformDefinitionSchema,
  MatrixDefinition,
  MatrixDefinitionSchema,
} from "./types";

export interface LoadedRegistries {
  inputs: Map<string, InputTypeDefinition>;
  digestKinds: Map<string, DigestKindDefinition>;
  formats: Map<string, FormatDefinition>;
  platforms: Map<string, PlatformDefinition>;
  matrix: MatrixDefinition;
}

export class RegistryValidationError extends Error {
  constructor(message: string, public readonly details?: unknown) {
    super(`[RegistryValidationError] ${message}`);
    this.name = "RegistryValidationError";
  }
}

/**
 * Validates an array of registry entities, checking schema compliance and uniqueness.
 */
function validateCollection<T extends { id: string }>(
  items: T[],
  schema: { parse: (val: unknown) => T },
  typeName: string
): Map<string, T> {
  const map = new Map<string, T>();

  for (const item of items) {
    // 1. Zod schema validation
    try {
      schema.parse(item);
    } catch (err) {
      throw new RegistryValidationError(
        `Invalid ${typeName} definition with ID "${item?.id}": ${err instanceof Error ? err.message : String(err)}`,
        err
      );
    }

    // 2. Uniqueness check
    if (map.has(item.id)) {
      throw new RegistryValidationError(
        `Duplicate ${typeName} ID detected: "${item.id}". Every ${typeName} ID must be unique.`
      );
    }

    map.set(item.id, item);
  }

  return map;
}

/**
 * Validates cross-reference integrity between the Matrix and all registered entities.
 */
function validateMatrixIntegrity(
  matrix: MatrixDefinition,
  inputs: Map<string, InputTypeDefinition>,
  formats: Map<string, FormatDefinition>,
  platforms: Map<string, PlatformDefinition>
): void {
  // Validate Matrix schema
  try {
    MatrixDefinitionSchema.parse(matrix);
  } catch (err) {
    throw new RegistryValidationError("Matrix definition failed schema validation", err);
  }

  // Check Input -> Format references
  for (const [inputId, targetFormats] of Object.entries(matrix.inputToFormats)) {
    if (!inputs.has(inputId)) {
      throw new RegistryValidationError(
        `Matrix references unknown input ID: "${inputId}". Registered inputs are: [${Array.from(inputs.keys()).join(", ")}]`
      );
    }

    for (const formatId of targetFormats) {
      if (!formats.has(formatId)) {
        throw new RegistryValidationError(
          `Matrix maps input "${inputId}" to unknown format ID: "${formatId}". Registered formats are: [${Array.from(formats.keys()).join(", ")}]`
        );
      }
    }
  }

  // Check Format -> Platform references
  for (const [formatId, targetPlatforms] of Object.entries(matrix.formatToPlatforms)) {
    if (!formats.has(formatId)) {
      throw new RegistryValidationError(
        `Matrix references unknown format ID: "${formatId}". Registered formats are: [${Array.from(formats.keys()).join(", ")}]`
      );
    }

    for (const platformId of targetPlatforms) {
      if (!platforms.has(platformId)) {
        throw new RegistryValidationError(
          `Matrix maps format "${formatId}" to unknown platform ID: "${platformId}". Registered platforms are: [${Array.from(platforms.keys()).join(", ")}]`
        );
      }
    }
  }
}

/**
 * Loads, validates, and freezes all registries.
 * Call this function during application startup or pipeline initialization.
 */
export function loadAndValidateRegistries(
  customInputs = ALL_INPUTS,
  customDigestKinds = ALL_DIGEST_KINDS,
  customFormats = ALL_FORMATS,
  customPlatforms = ALL_PLATFORMS,
  customMatrix = MATRIX_DEFINITION
): LoadedRegistries {
  const inputs = validateCollection(customInputs, InputTypeDefinitionSchema, "InputType");
  const digestKinds = validateCollection(customDigestKinds, DigestKindDefinitionSchema, "DigestKind");
  const formats = validateCollection(customFormats, FormatDefinitionSchema, "Format");
  const platforms = validateCollection(customPlatforms, PlatformDefinitionSchema, "Platform");

  validateMatrixIntegrity(customMatrix, inputs, formats, platforms);

  return {
    inputs,
    digestKinds,
    formats,
    platforms,
    matrix: customMatrix,
  };
}

