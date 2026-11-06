/**
 * Canvas Snap Guide Calculator
 * Calculates magnetic snapping coordinates and active guide lines during drag and resize.
 * System Layer: ui / brand / template-designer
 */

import { TemplateElement } from "@/render/template-schema";
import { SnapLine } from "./types";

const SNAP_THRESHOLD = 8; // Snap within 8 canvas pixels

export interface SnapResult {
  x: number;
  y: number;
  lines: SnapLine[];
}

export function calculateSnaps(
  target: { x: number; y: number; width: number; height: number; id: string },
  canvasWidth: number,
  canvasHeight: number,
  siblings: TemplateElement[]
): SnapResult {
  let snappedX = target.x;
  let snappedY = target.y;
  const lines: SnapLine[] = [];

  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;
  const targetRight = target.x + target.width;
  const targetBottom = target.y + target.height;

  // 1. Canvas Center Snapping
  const canvasCenterX = canvasWidth / 2;
  const canvasCenterY = canvasHeight / 2;

  if (Math.abs(targetCenterX - canvasCenterX) <= SNAP_THRESHOLD) {
    snappedX = canvasCenterX - target.width / 2;
    lines.push({
      orientation: "vertical",
      position: canvasCenterX,
      start: 0,
      end: canvasHeight,
      type: "center",
    });
  }

  if (Math.abs(targetCenterY - canvasCenterY) <= SNAP_THRESHOLD) {
    snappedY = canvasCenterY - target.height / 2;
    lines.push({
      orientation: "horizontal",
      position: canvasCenterY,
      start: 0,
      end: canvasWidth,
      type: "center",
    });
  }

  // 2. Safe Margins (5% padding boundary)
  const marginLeft = Math.round(canvasWidth * 0.05);
  const marginRight = Math.round(canvasWidth * 0.95);
  const marginTop = Math.round(canvasHeight * 0.05);
  const marginBottom = Math.round(canvasHeight * 0.95);

  // Left Margin
  if (Math.abs(target.x - marginLeft) <= SNAP_THRESHOLD) {
    snappedX = marginLeft;
    lines.push({
      orientation: "vertical",
      position: marginLeft,
      start: marginTop,
      end: marginBottom,
      type: "margin",
    });
  }
  // Right Margin
  if (Math.abs(targetRight - marginRight) <= SNAP_THRESHOLD) {
    snappedX = marginRight - target.width;
    lines.push({
      orientation: "vertical",
      position: marginRight,
      start: marginTop,
      end: marginBottom,
      type: "margin",
    });
  }
  // Top Margin
  if (Math.abs(target.y - marginTop) <= SNAP_THRESHOLD) {
    snappedY = marginTop;
    lines.push({
      orientation: "horizontal",
      position: marginTop,
      start: marginLeft,
      end: marginRight,
      type: "margin",
    });
  }
  // Bottom Margin
  if (Math.abs(targetBottom - marginBottom) <= SNAP_THRESHOLD) {
    snappedY = marginBottom - target.height;
    lines.push({
      orientation: "horizontal",
      position: marginBottom,
      start: marginLeft,
      end: marginRight,
      type: "margin",
    });
  }

  // 3. Sibling Alignment Snapping
  for (const sibling of siblings) {
    if (sibling.id === target.id) continue;

    const sibRight = sibling.x + sibling.width;
    const sibBottom = sibling.y + sibling.height;
    const sibCenterX = sibling.x + sibling.width / 2;

    // Align Left Edges
    if (Math.abs(target.x - sibling.x) <= SNAP_THRESHOLD) {
      snappedX = sibling.x;
      lines.push({
        orientation: "vertical",
        position: sibling.x,
        start: Math.min(target.y, sibling.y),
        end: Math.max(targetBottom, sibBottom),
        type: "element",
      });
    }

    // Align Center X with Sibling
    if (Math.abs(targetCenterX - sibCenterX) <= SNAP_THRESHOLD) {
      snappedX = sibCenterX - target.width / 2;
      lines.push({
        orientation: "vertical",
        position: sibCenterX,
        start: Math.min(target.y, sibling.y),
        end: Math.max(targetBottom, sibBottom),
        type: "element",
      });
    }

    // Align Right Edges
    if (Math.abs(targetRight - sibRight) <= SNAP_THRESHOLD) {
      snappedX = sibRight - target.width;
      lines.push({
        orientation: "vertical",
        position: sibRight,
        start: Math.min(target.y, sibling.y),
        end: Math.max(targetBottom, sibBottom),
        type: "element",
      });
    }
  }

  return { x: Math.round(snappedX), y: Math.round(snappedY), lines };
}

