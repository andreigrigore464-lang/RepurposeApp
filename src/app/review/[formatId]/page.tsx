/**
 * Review & Editing Workbench Page
 * Deep-dive editor for reviewing platform variants alongside source grounding sentences.
 * System Layer: ui / review
 */

import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { getFormatOutputById, listFormatOutputsForArticle } from "@/db/queries-format-outputs";
import { getArticleById } from "@/db/queries-articles";
import { getDigestByArticleId } from "@/db/queries-digests";
import { listVariantsForFormat } from "@/db/queries-platform-variants";
import { getBrandKitByBrandId } from "@/db/queries-brand-kit";
import { TemplateSchema, Template } from "@/render/template-schema";
import { BrandTheme, DEFAULT_BRAND_THEME, expandCarouselTemplate } from "@/render/layout/resolve-slots";
import { getBrandTemplate } from "@/render/load-brand-template";
import { FormatWorkbench } from "@/components/review/format-workbench";

export const dynamic = "force-dynamic";

interface ReviewPageProps {
  params: Promise<{ formatId: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { formatId } = await params;

  const formatOutput = await getFormatOutputById(formatId);
  if (!formatOutput) {
    notFound();
  }

  const [article, digest, platformVariants, brandKit, siblingFormats] = await Promise.all([
    getArticleById(formatOutput.article_id),
    getDigestByArticleId(formatOutput.article_id, "completed"),
    listVariantsForFormat(formatId),
    getBrandKitByBrandId(formatOutput.brand_id),
    listFormatOutputsForArticle(formatOutput.article_id),
  ]);

  if (!article) {
    notFound();
  }

  const brandTheme: BrandTheme = brandKit
    ? {
        primaryColor: brandKit.primary_color,
        secondaryColor: brandKit.secondary_color,
        backgroundColor: brandKit.background_color,
        textColor: brandKit.text_color,
        fontHeading: brandKit.font_heading,
        fontBody: brandKit.font_body,
      }
    : DEFAULT_BRAND_THEME;

  let cardTemplate: Template | undefined;
  let carouselTemplate: Template | undefined;
  const assignedTemplateId = formatOutput.slots_data?.template_id as string | undefined;

  try {
    cardTemplate = await getBrandTemplate(brandKit?.brand_id || "", "card", assignedTemplateId);
  } catch {
    // Template loading optional fallback
  }

  try {
    const parsedCarousel = await getBrandTemplate(brandKit?.brand_id || "", "carousel", assignedTemplateId);
    carouselTemplate = expandCarouselTemplate(parsedCarousel, formatOutput.slots_data || {});
  } catch {
    // Template loading optional fallback
  }

  return (
    <FormatWorkbench
      formatOutput={formatOutput}
      article={article}
      platformVariants={platformVariants}
      siblingFormats={siblingFormats}
      digestItems={digest?.items || []}
      brandTheme={brandTheme}
      cardTemplate={cardTemplate}
      carouselTemplate={carouselTemplate}
    />
  );
}

