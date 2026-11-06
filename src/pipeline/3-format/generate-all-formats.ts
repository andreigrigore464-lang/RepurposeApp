/**
 * Multi-Format Orchestrator Action
 * Resolves allowed formats from the matrix and coordinates slot synthesis for each format.
 * Pipeline Stage: 3-format
 */

import { FormatOutputRecord } from "../../db/queries-format-outputs";
import { DigestItem } from "../2-digest/digest-schema";
import { generateTextPostFormat } from "./generate-text-post";
import { generateThreadFormat } from "./generate-thread";
import { generateCardFormat } from "./generate-card";
import { generateCarouselFormat } from "./generate-carousel";
import { getAllowedFormatsForInput } from "../../registries/matrix";

export interface GenerateAllFormatsParams {
  articleId: string;
  digestId: string;
  brandId: string;
  articleTitle: string;
  digestItems: DigestItem[];
  inputSource?: string;
  brandVoiceGuidelines?: string;
  articleImages?: string[];
  enabledFormats?: string[];
  cardTemplateId?: string;
  carouselTemplateId?: string;
  preferredImageUrl?: string;
}

export async function generateAllFormatsForArticle(
  params: GenerateAllFormatsParams
): Promise<FormatOutputRecord[]> {
  const inputSource = params.inputSource || "rss";
  const matrixFormats = getAllowedFormatsForInput(inputSource);

  // If enabledFormats is explicitly configured, filter to that subset
  const allowedFormats = params.enabledFormats && params.enabledFormats.length > 0
    ? matrixFormats.filter((fmt) => params.enabledFormats!.includes(fmt))
    : matrixFormats;

  const records: FormatOutputRecord[] = [];

  // Reorder images if a preferred image URL was chosen by user
  let effectiveImages = params.articleImages ? [...params.articleImages] : [];
  if (params.preferredImageUrl) {
    effectiveImages = [
      params.preferredImageUrl,
      ...effectiveImages.filter((img) => img !== params.preferredImageUrl),
    ];
  }

  const baseContext = {
    articleId: params.articleId,
    digestId: params.digestId,
    brandId: params.brandId,
    articleTitle: params.articleTitle,
    digestItems: params.digestItems,
    brandVoiceGuidelines: params.brandVoiceGuidelines,
    articleImages: effectiveImages,
  };

  for (const formatId of allowedFormats) {
    try {
      let record: FormatOutputRecord;

      switch (formatId) {
        case "text-post":
          record = await generateTextPostFormat(baseContext);
          break;
        case "thread":
          record = await generateThreadFormat(baseContext);
          break;
        case "card":
          record = await generateCardFormat({
            ...baseContext,
            templateId: params.cardTemplateId,
          });
          break;
        case "carousel":
          record = await generateCarouselFormat({
            ...baseContext,
            templateId: params.carouselTemplateId,
          });
          break;
        default:
          console.warn(`[format] Unknown format ID: "${formatId}". Skipping.`);
          continue;
      }

      records.push(record);
    } catch (err) {
      console.error(
        `[format] article=${params.articleId} format=${formatId} status=failed error="${err instanceof Error ? err.message : String(err)}"`
      );
    }
  }

  return records;
}

