/**
 * Generic Hashtag Formatter
 * Formats and limits hashtags deterministically according to a platform's declarative hashtag policy.
 * Pipeline Stage: 4-adapt
 */

import { PlatformConstraints } from "../../registries/types";

export function formatHashtagsByPolicy(
  rawTags: string[],
  policy: PlatformConstraints["hashtagPolicy"]
): string[] {
  if (policy.placement === "disallowed" || policy.maxCount === 0 || !rawTags.length) {
    return [];
  }

  const cleanTags: string[] = [];
  for (const tag of rawTags) {
    const trimmed = tag.trim().replace(/^#+/, "");
    if (trimmed.length > 0) {
      cleanTags.push(`#${trimmed}`);
    }
    if (cleanTags.length >= policy.maxCount) {
      break;
    }
  }

  return cleanTags;
}

