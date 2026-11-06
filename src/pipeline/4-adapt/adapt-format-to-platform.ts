/**
 * Generic Platform Adapter
 * Deterministically transforms platform-agnostic format outputs into platform-specific variants.
 * Strictly driven by the declarative platform registry definition. Zero hardcoded platform names.
 * Pipeline Stage: 4-adapt
 */

import { PlatformDefinition } from "../../registries/types";
import { FormatOutputRecord } from "../../db/queries-format-outputs";
import { formatHashtagsByPolicy } from "./format-hashtags";

export interface AdaptationResult {
  platformId: string;
  adaptedPayload: Record<string, unknown>;
  isValid: boolean;
  warnings: string[];
}

export interface AdaptOptions {
  brandHashtags?: string[];
  canonicalUrl?: string;
}

export function adaptFormatToPlatform(
  formatOutput: FormatOutputRecord,
  platform: PlatformDefinition,
  options: AdaptOptions = {}
): AdaptationResult {
  const { constraints } = platform;
  const separator = constraints.formattingRules.paragraphSeparator;
  const warnings: string[] = [];
  const slots = formatOutput.slots_data as any;

  // Format hashtags according to declarative platform policy
  const formattedTags = formatHashtagsByPolicy(
    options.brandHashtags || ["DigitalPublishing", "ContentStrategy"],
    constraints.hashtagPolicy
  );
  const tagBlock = formattedTags.length > 0 ? formattedTags.join(" ") : "";

  let adaptedPayload: Record<string, unknown> = {};

  switch (formatOutput.format_kind) {
    case "text-post": {
      const parts: string[] = [];

      if (slots.hook) parts.push(slots.hook);
      if (Array.isArray(slots.body_paragraphs)) {
        parts.push(...slots.body_paragraphs);
      }
      if (slots.takeaway) parts.push(`Key Takeaway: ${slots.takeaway}`);

      let cta = slots.call_to_action || "";
      if (options.canonicalUrl && constraints.formattingRules.supportsClickableLinks) {
        cta += `\nRead more: ${options.canonicalUrl}`;
      }
      if (cta) parts.push(cta);

      if (tagBlock && constraints.hashtagPolicy.placement === "end-of-post") {
        parts.push(tagBlock);
      }

      let fullText = parts.join(separator);

      // If full text exceeds platform maxCharacters, condense deterministically to hook + CTA + tags
      if (fullText.length > constraints.maxCharacters) {
        const conciseParts: string[] = [];
        if (slots.hook) conciseParts.push(slots.hook);
        if (cta) conciseParts.push(cta);
        if (tagBlock && constraints.hashtagPolicy.placement === "end-of-post") {
          conciseParts.push(tagBlock);
        }

        const conciseText = conciseParts.join(separator);
        if (conciseText.length <= constraints.maxCharacters) {
          fullText = conciseText;
          warnings.push(
            `INFO: Content condensed to hook and call-to-action to fit platform limit of ${constraints.maxCharacters} chars.`
          );
        } else {
          // If even hook + CTA exceeds limit, truncate safely
          const budget = constraints.maxCharacters - (tagBlock ? tagBlock.length + separator.length : 0);
          const truncatedHook = slots.hook.slice(0, Math.max(20, budget - 4)).trimEnd() + "...";
          const fallbackParts = [truncatedHook];
          if (tagBlock) fallbackParts.push(tagBlock);
          fullText = fallbackParts.join(separator);
          warnings.push(
            `CAUTION: Content truncated with ellipsis to satisfy platform ceiling of ${constraints.maxCharacters} chars.`
          );
        }
      }

      // Check visible fold truncation
      if (constraints.visibleFoldCharacters && slots.hook.length > constraints.visibleFoldCharacters) {
        warnings.push(
          `CAUTION: Hook (${slots.hook.length} chars) extends past platform visible fold cutoff (~${constraints.visibleFoldCharacters} chars).`
        );
      }

      adaptedPayload = {
        type: "single-post",
        text: fullText,
        characterCount: fullText.length,
        maxCharacters: constraints.maxCharacters,
        hashtags: formattedTags,
      };
      break;
    }

    case "thread": {
      const rawPosts: string[] = [
        slots.hook_post,
        ...(Array.isArray(slots.body_posts) ? slots.body_posts : []),
        slots.conclusion_post,
        slots.call_to_action_post,
      ].filter(Boolean);

      const totalPosts = rawPosts.length;

      if (constraints.mediaCapabilities.supportsThread) {
        // Native thread formatting with numbering
        const posts: string[] = [];
        rawPosts.forEach((postText, idx) => {
          const postNum = `[${idx + 1}/${totalPosts}] `;
          let finalPostText = `${postNum}${postText}`;

          // Append link to last post if supported
          if (
            idx === totalPosts - 1 &&
            options.canonicalUrl &&
            constraints.formattingRules.supportsClickableLinks
          ) {
            finalPostText += `\n${options.canonicalUrl}`;
          }

          // Append hashtags to last post if supported
          if (idx === totalPosts - 1 && tagBlock) {
            finalPostText += `\n\n${tagBlock}`;
          }

          if (finalPostText.length > constraints.maxCharacters) {
            warnings.push(
              `CAUTION: Thread post ${idx + 1} (${finalPostText.length} chars) was trimmed to satisfy platform limit of ${constraints.maxCharacters} chars.`
            );
            finalPostText = finalPostText.slice(0, constraints.maxCharacters - 3).trimEnd() + "...";
          }

          posts.push(finalPostText);
        });

        adaptedPayload = {
          type: "thread",
          posts,
          postCount: posts.length,
          maxCharactersPerPost: constraints.maxCharacters,
          hashtags: formattedTags,
        };
      } else {
        // Platform does not support native threads: combine into a single post if capacity allows
        let combinedText = rawPosts.join(separator) + (tagBlock ? `${separator}${tagBlock}` : "");
        if (combinedText.length > constraints.maxCharacters) {
          combinedText = combinedText.slice(0, constraints.maxCharacters - 3).trimEnd() + "...";
          warnings.push(
            `CAUTION: Thread converted to single post and trimmed to fit platform ceiling of ${constraints.maxCharacters} chars.`
          );
        } else {
          warnings.push(
            `INFO: Platform does not support native threads; converted into a single unified post.`
          );
        }

        adaptedPayload = {
          type: "single-post",
          text: combinedText,
          characterCount: combinedText.length,
          maxCharacters: constraints.maxCharacters,
          hashtags: formattedTags,
        };
      }
      break;
    }

    case "card": {
      let caption = `${slots.kicker}: ${slots.headline}`;
      if (slots.subhead) caption += `${separator}${slots.subhead}`;
      if (slots.attribution) caption += `${separator}Source: ${slots.attribution}`;
      if (tagBlock) caption += `${separator}${tagBlock}`;

      if (caption.length > constraints.maxCharacters) {
        caption = caption.slice(0, constraints.maxCharacters - 3).trimEnd() + "...";
        warnings.push(
          `CAUTION: Card caption trimmed to fit platform limit of ${constraints.maxCharacters} chars.`
        );
      }

      adaptedPayload = {
        type: "card-post",
        captionText: caption,
        characterCount: caption.length,
        mediaSpec: {
          mediaType: "single-image",
          aspectRatio: "1:1",
        },
        hashtags: formattedTags,
      };
      break;
    }

    case "carousel": {
      const cover = slots.cover_slide;
      const bodySlides = Array.isArray(slots.body_slides) ? slots.body_slides : [];
      const totalSlides = bodySlides.length + 2; // cover + body + closing

      let packagingType: "pdf-document" | "image-sequence" | "unsupported" = "unsupported";

      if (constraints.mediaCapabilities.supportsCarouselPdf) {
        packagingType = "pdf-document";
      } else if (constraints.mediaCapabilities.supportsImageSequence) {
        packagingType = "image-sequence";
        if (totalSlides > constraints.mediaCapabilities.maxImageCount) {
          warnings.push(
            `CAUTION: Carousel has ${totalSlides} slides, but platform allows at most ${constraints.mediaCapabilities.maxImageCount} images.`
          );
        }
      } else {
        warnings.push(`ERROR: Platform does not support native carousel or multi-image slides.`);
      }

      let caption = cover?.title ? `${cover.kicker || "CAROUSEL"}: ${cover.title}` : "Visual Carousel";
      if (cover?.subtitle) caption += `${separator}${cover.subtitle}`;
      if (tagBlock) caption += `${separator}${tagBlock}`;

      if (caption.length > constraints.maxCharacters) {
        caption = caption.slice(0, constraints.maxCharacters - 3).trimEnd() + "...";
        warnings.push(
          `CAUTION: Carousel caption trimmed to fit platform limit of ${constraints.maxCharacters} chars.`
        );
      }

      adaptedPayload = {
        type: "carousel-post",
        captionText: caption,
        characterCount: caption.length,
        mediaSpec: {
          mediaType: packagingType,
          slideCount: totalSlides,
          aspectRatio: "4:5",
        },
        hashtags: formattedTags,
      };
      break;
    }

    default:
      warnings.push(`ERROR: Unknown format kind "${formatOutput.format_kind}".`);
  }

  const hasFatalError = warnings.some((w) => w.startsWith("ERROR:"));

  return {
    platformId: platform.id,
    adaptedPayload,
    isValid: !hasFatalError,
    warnings,
  };
}
