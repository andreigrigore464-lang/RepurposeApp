/**
 * Asset Export API Route Handler
 * Generates downloadable high-resolution PNG cards and multi-page Carousel PDFs on demand.
 * System Layer: api / export
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getFormatOutputById } from "@/db/queries-format-outputs";
import { getArticleById } from "@/db/queries-articles";
import { getBrandKitByBrandId } from "@/db/queries-brand-kit";
import { TemplateSchema } from "@/render/template-schema";
import { renderTemplateToPngBuffer } from "@/render/render-on-server";
import { compileCarouselPdf } from "@/render/compile-carousel-pdf";
import { BrandTheme, DEFAULT_BRAND_THEME, expandCarouselTemplate } from "@/render/layout/resolve-slots";
import { getBrandTemplate } from "@/render/load-brand-template";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const formatId = searchParams.get("formatId");
    const exportType = searchParams.get("type") || "png"; // 'png' or 'pdf'

    if (!formatId) {
      return NextResponse.json({ error: "Missing formatId query parameter." }, { status: 400 });
    }

    const formatOutput = await getFormatOutputById(formatId);
    if (!formatOutput) {
      return NextResponse.json({ error: `Format output "${formatId}" not found.` }, { status: 404 });
    }

    // Resolve brand kit theme tokens
    const brandKit = await getBrandKitByBrandId(formatOutput.brand_id);
    const theme: BrandTheme = brandKit
      ? {
          primaryColor: brandKit.primary_color,
          secondaryColor: brandKit.secondary_color,
          backgroundColor: brandKit.background_color,
          textColor: brandKit.text_color,
          fontHeading: brandKit.font_heading,
          fontBody: brandKit.font_body,
        }
      : DEFAULT_BRAND_THEME;

    const article = await getArticleById(formatOutput.article_id);
    const slotData: Record<string, unknown> = {
      ...(formatOutput.slots_data || {}),
      article_image:
        (formatOutput.slots_data?.article_image as string) ||
        article?.in_article_images?.[0] ||
        "",
      in_article_images:
        (formatOutput.slots_data?.in_article_images as string[]) ||
        article?.in_article_images ||
        [],
    };

    const assignedTemplateId = formatOutput.slots_data?.template_id as string | undefined;

    if (formatOutput.format_kind === "card") {
      const template = await getBrandTemplate(formatOutput.brand_id, "card", assignedTemplateId);

      const pngBuffer = await renderTemplateToPngBuffer(template, 0, slotData, theme);

      return new NextResponse(pngBuffer as any, {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="card-${formatId.slice(0, 8)}.png"`,
        },
      });
    }

    if (formatOutput.format_kind === "carousel") {
      const rawTemplate = await getBrandTemplate(formatOutput.brand_id, "carousel", assignedTemplateId);
      const template = expandCarouselTemplate(rawTemplate, slotData);

      if (exportType === "pdf") {
        const slideBuffers: Buffer[] = [];
        for (const page of template.pages) {
          const buf = await renderTemplateToPngBuffer(template, page.page_index, slotData, theme);
          slideBuffers.push(buf);
        }

        const pdfBuffer = await compileCarouselPdf(slideBuffers, {
          title: "Editorial Carousel",
          author: "Repurpose SaaS",
        });

        return new NextResponse(pdfBuffer as any, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="carousel-${formatId.slice(0, 8)}.pdf"`,
          },
        });
      } else {
        // Single slide PNG (default page 0 cover)
        const pageIndex = parseInt(searchParams.get("page") || "0", 10);
        const pngBuffer = await renderTemplateToPngBuffer(template, pageIndex, slotData, theme);

        return new NextResponse(pngBuffer as any, {
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="carousel-slide-${pageIndex}.png"`,
          },
        });
      }
    }

    return NextResponse.json(
      { error: `Export not applicable for text format "${formatOutput.format_kind}". Use copy text.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("[export] Error generating export:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

