/**
 * Multi-Page Carousel PDF Assembler
 * Compiles an array of slide PNG buffers into a standardized multi-page PDF document.
 * System Layer: render
 */

import { PDFDocument } from "pdf-lib";

export interface CompilePdfOptions {
  title?: string;
  author?: string;
}

/**
 * Assembles multiple slide image buffers into a single multi-page PDF.
 * Each PDF page is dynamically sized to match the slide image dimensions.
 */
export async function compileCarouselPdf(
  slideBuffers: Buffer[],
  options?: CompilePdfOptions
): Promise<Buffer> {
  if (slideBuffers.length === 0) {
    throw new Error("Cannot compile PDF: slideBuffers array is empty.");
  }

  const pdfDoc = await PDFDocument.create();

  if (options?.title) {
    pdfDoc.setTitle(options.title);
  }
  if (options?.author) {
    pdfDoc.setAuthor(options.author);
  }

  for (let i = 0; i < slideBuffers.length; i++) {
    const buffer = slideBuffers[i];
    const embeddedImage = await pdfDoc.embedPng(buffer);

    const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: embeddedImage.width,
      height: embeddedImage.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

