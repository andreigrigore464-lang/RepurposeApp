/**
 * Shared Text Layout & Bounds Calculator
 * Calculates uniform line wrapping and auto-shrinking font sizes so text fits inside element boxes.
 * Shared between client-side Konva and server-side Node canvas to guarantee 1:1 render parity.
 * System Layer: render
 */

import { TextElement } from "../template-schema";

export interface TextLayoutResult {
  lines: string[];
  fontSize: number;
  lineHeightPx: number;
  totalHeightPx: number;
}

export interface MeasureTextContext {
  measureText(text: string): { width: number };
  font?: string;
}

/**
 * Wraps text into lines that do not exceed maxWidth given a measureText function.
 */
export function wrapTextLines(
  text: string,
  maxWidth: number,
  measureFn: (str: string) => number
): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push("");
      continue;
    }

    const words = para.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = measureFn(testLine);

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word wider than box: push anyway
          lines.push(word);
          currentLine = "";
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Calculates wrapped lines and shrinks font size until text fits within element dimensions.
 */
export function calculateTextLayout(
  text: string,
  element: TextElement,
  measureContext?: MeasureTextContext
): TextLayoutResult {
  const minFontSize = 18;
  let currentFontSize = element.font_size;
  const lineHeightRatio = element.line_height || 1.3;

  // Approximate width ratio per character if measureContext is unavailable
  const approxMeasure = (str: string, size: number) => str.length * (size * 0.55);

  const getMeasureFn = (size: number) => {
    if (measureContext) {
      return (str: string) => {
        const weight = element.font_weight || "normal";
        const family = element.font_family || "Inter";
        measureContext.font = `${weight} ${size}px "${family}"`;
        return measureContext.measureText(str).width;
      };
    }
    return (str: string) => approxMeasure(str, size);
  };

  while (currentFontSize >= minFontSize) {
    const measureFn = getMeasureFn(currentFontSize);
    const lines = wrapTextLines(text, element.width, measureFn);
    const lineHeightPx = currentFontSize * lineHeightRatio;
    const totalHeightPx = lines.length * lineHeightPx;

    if (!element.auto_shrink_font || totalHeightPx <= element.height || currentFontSize <= minFontSize) {
      return {
        lines,
        fontSize: currentFontSize,
        lineHeightPx,
        totalHeightPx,
      };
    }

    // Shrink font by 2px and retry
    currentFontSize -= 2;
  }

  const finalMeasure = getMeasureFn(minFontSize);
  const finalLines = wrapTextLines(text, element.width, finalMeasure);
  const finalLineHeight = minFontSize * lineHeightRatio;

  return {
    lines: finalLines,
    fontSize: minFontSize,
    lineHeightPx: finalLineHeight,
    totalHeightPx: finalLines.length * finalLineHeight,
  };
}

