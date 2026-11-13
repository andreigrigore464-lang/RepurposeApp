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

  if (el.rotation) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  if (el.shadow_color && el.shadow_blur) {
    ctx.shadowColor = el.shadow_color;
    ctx.shadowBlur = el.shadow_blur;
    ctx.shadowOffsetX = el.shadow_offset_x || 0;
    ctx.shadowOffsetY = el.shadow_offset_y || 0;
  }

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
  } else if (el.shape_type === "triangle") {
    ctx.moveTo(el.x + el.width / 2, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height);
    ctx.lineTo(el.x, el.y + el.height);
    ctx.closePath();
  } else if (el.shape_type === "star") {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const outerR = Math.min(el.width, el.height) / 2;
    const innerR = outerR * 0.45;
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (el.shape_type === "hexagon") {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const rx = el.width / 2;
    const ry = el.height / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const px = cx + Math.cos(angle) * rx;
      const py = cy + Math.sin(angle) * ry;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (el.shape_type === "arrow") {
    const shaftH = el.height * 0.4;
    const shaftY = el.y + (el.height - shaftH) / 2;
    const headW = el.width * 0.4;
    ctx.moveTo(el.x, shaftY);
    ctx.lineTo(el.x + el.width - headW, shaftY);
    ctx.lineTo(el.x + el.width - headW, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height / 2);
    ctx.lineTo(el.x + el.width - headW, el.y + el.height);
    ctx.lineTo(el.x + el.width - headW, shaftY + shaftH);
    ctx.lineTo(el.x, shaftY + shaftH);
    ctx.closePath();
  } else if (el.shape_type === "badge") {
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + el.width, el.y);
    ctx.lineTo(el.x + el.width, el.y + el.height);
    ctx.lineTo(el.x + el.width / 2, el.y + el.height * 0.82);
    ctx.lineTo(el.x, el.y + el.height);
    ctx.closePath();
  }

  if (el.fill) {
    ctx.fillStyle = el.fill;
    ctx.fill();
  }
  if (el.stroke && el.stroke_width) {
    if (el.stroke_dash === "dashed") {
      ctx.setLineDash([8, 6]);
    } else if (el.stroke_dash === "dotted") {
      ctx.setLineDash([3, 4]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = el.stroke;
    ctx.lineWidth = el.stroke_width;
    ctx.stroke();
  }
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, el: TextElement): void {
  let text = el.default_text || "";
  if (!text) return;

  if (el.text_transform === "uppercase") {
    text = text.toUpperCase();
  } else if (el.text_transform === "lowercase") {
    text = text.toLowerCase();
  } else if (el.text_transform === "capitalize") {
    text = text.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  ctx.save();
  if (el.opacity !== undefined) ctx.globalAlpha = el.opacity;

  if (el.rotation) {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((el.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  if (el.shadow_color && el.shadow_blur) {
    ctx.shadowColor = el.shadow_color;
    ctx.shadowBlur = el.shadow_blur;
    ctx.shadowOffsetX = el.shadow_offset_x || 0;
    ctx.shadowOffsetY = el.shadow_offset_y || 0;
  }

  const layout = calculateTextLayout(text, el, ctx);
  const style = el.font_style === "italic" ? "italic" : "normal";
  const weight = el.font_weight || "normal";
  const family = el.font_family || "Inter";
  ctx.font = `${style} ${weight} ${layout.fontSize}px "${family}"`;
  ctx.fillStyle = el.color || "#000000";
  ctx.textBaseline = "top";

  let currentY = el.y;
  for (const line of layout.lines) {
    let lineX = el.x;
    const metrics = ctx.measureText(line);
    if (el.text_align === "center") {
      lineX = el.x + (el.width - metrics.width) / 2;
    } else if (el.text_align === "right") {
      lineX = el.x + el.width - metrics.width;
    }

    ctx.fillText(line, lineX, currentY);

    if (el.text_decoration === "underline") {
      ctx.beginPath();
      ctx.moveTo(lineX, currentY + layout.fontSize * 1.15);
      ctx.lineTo(lineX + metrics.width, currentY + layout.fontSize * 1.15);
      ctx.strokeStyle = el.color || "#000000";
      ctx.lineWidth = Math.max(1, Math.round(layout.fontSize / 16));
      ctx.stroke();
    } else if (el.text_decoration === "line-through") {
      ctx.beginPath();
      ctx.moveTo(lineX, currentY + layout.fontSize * 0.55);
      ctx.lineTo(lineX + metrics.width, currentY + layout.fontSize * 0.55);
      ctx.strokeStyle = el.color || "#000000";
      ctx.lineWidth = Math.max(1, Math.round(layout.fontSize / 16));
      ctx.stroke();
    }

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

