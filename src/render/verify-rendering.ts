/**
 * Phase 7 Rendering Engine Verification Script
 * Validates server-side PNG rendering and multi-page PDF compilation against templates.
 * System Layer: test / verification
 */

import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { TemplateSchema, Template } from "./template-schema";
import { renderTemplateToPngBuffer } from "./render-on-server";
import { compileCarouselPdf } from "./compile-carousel-pdf";
import { DEFAULT_BRAND_THEME } from "./layout/resolve-slots";
import { supabase } from "../db/client";

function readPngDimensions(buffer: Buffer): { width: number; height: number } {
  // Standard PNG header: 8 bytes signature, IHDR chunk length (4), chunk type "IHDR" (4), width (4), height (4)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

async function runVerification(): Promise<void> {
  console.log("=== PHASE 7 RENDERING ENGINE VERIFICATION ===");

  const exportsDir = path.resolve(process.cwd(), "public/exports-test");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  // 1. Load and validate declarative templates
  const cardTemplateRaw = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "src/render/templates/card-default.json"), "utf8")
  );
  const carouselTemplateRaw = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "src/render/templates/carousel-default.json"), "utf8")
  );

  const cardTemplate = TemplateSchema.parse(cardTemplateRaw);
  const carouselTemplate = TemplateSchema.parse(carouselTemplateRaw);
  console.log(`[templates] Loaded and validated ${cardTemplate.id} and ${carouselTemplate.id}`);

  // 2. Fetch format data from database
  const { data: dbOutputs } = await supabase
    .from("format_outputs")
    .select("format, data")
    .eq("status", "completed");

  const cardRecord = dbOutputs?.find((o) => o.format === "card");
  const carouselRecord = dbOutputs?.find((o) => o.format === "carousel");

  const cardData = (cardRecord?.data as Record<string, unknown>) || {};
  const carouselData = (carouselRecord?.data as Record<string, unknown>) || {};

  console.log(`[data] Loaded slot data from DB for card and carousel`);

  // 3. Test Card Rendering
  console.log("[render] Rendering single-page Card template...");
  const cardPngBuffer = await renderTemplateToPngBuffer(
    cardTemplate,
    0,
    cardData,
    DEFAULT_BRAND_THEME
  );

  const cardDims = readPngDimensions(cardPngBuffer);
  console.log(`[render] Card PNG size: ${cardPngBuffer.length} bytes, dimensions: ${cardDims.width}x${cardDims.height}`);

  if (cardDims.width !== 1080 || cardDims.height !== 1080) {
    throw new Error(`Expected card 1080x1080, got ${cardDims.width}x${cardDims.height}`);
  }

  const cardOutputPath = path.join(exportsDir, "card.png");
  fs.writeFileSync(cardOutputPath, cardPngBuffer);
  console.log(`[export] Saved: ${cardOutputPath}`);

  // 4. Test Carousel Rendering (All Pages)
  console.log(`[render] Rendering multi-page Carousel (${carouselTemplate.pages.length} slides)...`);
  const carouselSlideBuffers: Buffer[] = [];

  for (const page of carouselTemplate.pages) {
    const slideBuffer = await renderTemplateToPngBuffer(
      carouselTemplate,
      page.page_index,
      carouselData,
      DEFAULT_BRAND_THEME
    );

    const dims = readPngDimensions(slideBuffer);
    console.log(`[render] Slide ${page.page_index} size: ${slideBuffer.length} bytes, dimensions: ${dims.width}x${dims.height}`);

    if (dims.width !== 1080 || dims.height !== 1350) {
      throw new Error(`Expected slide 1080x1350, got ${dims.width}x${dims.height}`);
    }

    const slideOutputPath = path.join(exportsDir, `carousel-slide-${page.page_index}.png`);
    fs.writeFileSync(slideOutputPath, slideBuffer);
    carouselSlideBuffers.push(slideBuffer);
  }

  // 5. Test PDF Compilation
  console.log("[pdf] Compiling multi-page PDF from slide buffers...");
  const pdfBuffer = await compileCarouselPdf(carouselSlideBuffers, {
    title: "Editorial Playbook",
    author: "The Chronicle",
  });

  console.log(`[pdf] Generated PDF size: ${pdfBuffer.length} bytes`);

  if (!pdfBuffer.slice(0, 5).toString().startsWith("%PDF-")) {
    throw new Error("Compiled buffer does not have valid PDF header.");
  }

  const pdfOutputPath = path.join(exportsDir, "carousel.pdf");
  fs.writeFileSync(pdfOutputPath, pdfBuffer);
  console.log(`[export] Saved: ${pdfOutputPath}`);

  // 6. Verify PDF Page Count
  const loadedPdf = await PDFDocument.load(pdfBuffer);
  const pageCount = loadedPdf.getPageCount();
  console.log(`[pdf] Loaded compiled PDF. Page count: ${pageCount}`);

  if (pageCount !== carouselTemplate.pages.length) {
    throw new Error(`Expected ${carouselTemplate.pages.length} pages in PDF, found ${pageCount}`);
  }

  console.log("=== ALL PHASE 7 RENDERING CHECKS PASSED ===");
}

runVerification().catch((err) => {
  console.error("Rendering verification failed:", err);
  process.exit(1);
});

