/**
 * Multi-Platform Adaptation Orchestrator
 * Queries the Matrix for all permissible Format -> Platform pairings and generates
 * platform variants deterministically without any hardcoded platform names.
 * Pipeline Stage: 4-adapt
 */

import { FormatOutputRecord } from "../../db/queries-format-outputs";
import { insertPlatformVariant, PlatformVariantRecord } from "../../db/queries-platform-variants";
import { ALL_PLATFORMS } from "../../registries/platforms/all-platforms";
import { getAllowedPlatformsForFormat } from "../../registries/matrix";
import { adaptFormatToPlatform, AdaptOptions } from "./adapt-format-to-platform";

export async function adaptAllFormatsToPlatforms(
  formatOutputs: FormatOutputRecord[],
  options: AdaptOptions = {}
): Promise<PlatformVariantRecord[]> {
  const platformMap = new Map(ALL_PLATFORMS.map((p) => [p.id, p]));
  const createdVariants: PlatformVariantRecord[] = [];

  for (const format of formatOutputs) {
    const allowedPlatformIds = getAllowedPlatformsForFormat(format.format_kind);

    for (const platformId of allowedPlatformIds) {
      const platformDef = platformMap.get(platformId);
      if (!platformDef) {
        console.warn(`[adapt] Platform "${platformId}" not found in registry. Skipping.`);
        continue;
      }

      const result = adaptFormatToPlatform(format, platformDef, options);

      const variant = await insertPlatformVariant({
        formatOutputId: format.id,
        platformId: result.platformId,
        adaptedPayload: result.adaptedPayload,
        isValid: result.isValid,
        warnings: result.warnings,
      });

      console.log(
        `[adapt] format=${format.format_kind} platform=${result.platformId} valid=${result.isValid} warnings=${result.warnings.length}`
      );

      createdVariants.push(variant);
    }
  }

  return createdVariants;
}

