/**
 * Server-Side Template Canvas Renderer
 * Renders declarative visual templates to PNG buffers using Node Canvas.
 * System Layer: render
 */

import path from "path";
import fs from "fs";
import { createCanvas, registerFont, loadImage, CanvasRenderingContext2D } from "canvas";
import { Template, TemplatePage, ShapeElement, TextElement, ImageElement } from "./template-schema";
import { resolveElement, BrandTheme, DEFAULT_BRAND_THEME } from "./layout/resolve-slots";
import { calculateTextLayout } from "./layout/calculate-text-layout";

let fontsRegistered = false;

function ensureFontsRegistered(): void {
  if (fontsRegistered) return;

  const interPath = path.resolve(process.cwd(), "public/fonts/Inter-Regular.ttf");
  const playfairPath = path.resolve(process.cwd(), "public/fonts/PlayfairDisplay-Bold.ttf");

  if (fs.existsSync(interPath)) {
    registerFont(interPath, { family: "Inter", weight: "normal" });
  }
  if (fs.existsSync(playfairPath)) {
    registerFont(playfairPath, { family: "Playfair Display", weight: "bold" });
  }

  fontsRegistered = true;
}

function drawShape(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
  ctx.save();
  if (el.opacity !== undefined) ctx.globalAlpha = el.opacity;

  ctx.beginPath();
  if (el.shape_type === "rect") {
    const r = el.border_radius || 0;
    if (r > 0 && typeof ctx.roundRect === "function") {
      ctx.roundRect(el.x, el.y, el.width, el.height, r);
    } else {
      ctx.rect(el.x, el.y, el.width, el.height);
    }
  } else if (el.shape_type === "circle") {
    const radius = Math.min(el.width, el.height) / 2;
    ctx.arc(el.x + radius, el.y + radius, radius, 0, Math.PI * 2);
  } else if (el.shape_type === "line") {
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height);
  }

  if (el.fill) {
    ctx.fillStyle = el.fill;
    ctx.fill();
  }
  if (el.stroke && el.stroke_width) {
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.stroke_width;
    ctx.stroke();
  }
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  const text = el.default_text || "";
  if (!text) return;

  ctx.save();
  if (el.opacity !== undefined) ctx.globalAlpha = el.opacity;

  const layout = calculateTextLayout(text, el, ctx);
  const weight = el.font_weight || "normal";
  const family = el.font_family || "Inter";
  ctx.font = `${weight} ${layout.fontSize}px "${family}"`;
  ctx.fillStyle = el.color || "#000000";
  ctx.textBaseline = "top";

  let currentY = el.y;
  for (const line of layout.lines) {
    let lineX = el.x;
    if (el.text_align === "center") {
      const metrics = ctx.measureText(line);
      lineX = el.x + (el.width - metrics.width) / 2;
    } else if (el.text_align === "right") {
      const metrics = ctx.measureText(line);
      lineX = el.x + el.width - metrics.width;
    }

    ctx.fillText(line, lineX, currentY);
    currentY += layout.lineHeightPx;
  }

  ctx.restore();
}

async function drawImageElement(ctx: CanvasRenderingContext2D, el: ImageElement): Promise<void> {
  const url = el.default_url;
  if (!url) return;

  try {
    const img = await loadImage(url);
    ctx.save();
    if (el.opacity !== undefined) ctx.globalAlpha = el.opacity;

    if (el.border_radius && typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.width, el.height, el.border_radius);
      ctx.clip();
    }

    ctx.drawImage(img, el.x, el.y, el.width, el.height);
    ctx.restore();
  } catch (error) {
    // Graceful placeholder fallback if image fails to load
    ctx.save();
    ctx.fillStyle = "#e4e4e7";
    ctx.fillRect(el.x, el.y, el.width, el.height);
    ctx.restore();
  }
}

/**
 * Renders a specific template page into a PNG Buffer.
 */
export async function renderTemplateToPngBuffer(
  template: Template,
  pageIndex: number,
  slotData: Record<string, unknown>,
  theme: BrandTheme = DEFAULT_BRAND_THEME
): Promise<Buffer> {
  ensureFontsRegistered();

  const page = template.pages.find((p) => p.page_index === pageIndex) || template.pages[0];
  const { width, height } = template.dimensions;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 1. Draw page background
  if (page.background.color) {
    ctx.fillStyle = page.background.color;
    ctx.fillRect(0, 0, width, height);
  }

  if (page.background.image_url) {
    try {
      const bgImg = await loadImage(page.background.image_url);
      ctx.drawImage(bgImg, 0, 0, width, height);
    } catch {
      // Ignore background image load failure and keep color
    }
  }

  // 2. Render each element in order
  for (const rawElement of page.elements) {
    const el = resolveElement(rawElement, slotData, theme);

    if (el.type === "shape") {
      drawShape(ctx, el);
    } else if (el.type === "text") {
      drawText(ctx, el);
    } else if (el.type === "image") {
      await drawImageElement(ctx, el);
    }
  }

  return canvas.toBuffer("image/png");
}

