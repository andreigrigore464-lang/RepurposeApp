"use client";

/**
 * Client-Side Konva Interactive Preview Component
 * Renders declarative templates in browser canvas with live slot binding.
 * System Layer: render
 */

import React, { useEffect, useState } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Line, Circle, Image as KonvaImage } from "react-konva";
import { Template, ShapeElement, TextElement, ImageElement } from "./template-schema";
import { resolveElement, BrandTheme, DEFAULT_BRAND_THEME } from "./layout/resolve-slots";
import { calculateTextLayout } from "./layout/calculate-text-layout";

function BrowserKonvaImage({ el }: { el: ImageElement }): React.JSX.Element {
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = el.default_url;
    if (!url) {
      setLoadedImage(null);
      return;
    }

    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => {
      if (isMounted) setLoadedImage(img);
    };
    img.onerror = () => {
      if (isMounted) setLoadedImage(null);
    };

    return () => {
      isMounted = false;
    };
  }, [el.default_url]);

  if (loadedImage) {
    return (
      <KonvaImage
        key={el.id}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        image={loadedImage}
        cornerRadius={el.border_radius || 0}
        opacity={el.opacity ?? 1}
      />
    );
  }

  return (
    <Rect
      key={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      fill="#f4f4f5"
      stroke="#cbd5e1"
      strokeWidth={1}
      cornerRadius={el.border_radius || 6}
      opacity={el.opacity ?? 0.8}
    />
  );
}

export interface RenderInBrowserProps {
  template: Template;
  pageIndex: number;
  slotData: Record<string, unknown>;
  theme?: BrandTheme;
  scale?: number;
  className?: string;
}

export function RenderInBrowser({
  template,
  pageIndex,
  slotData,
  theme = DEFAULT_BRAND_THEME,
  scale = 1,
  className = "",
}: RenderInBrowserProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm ${className}`}
        style={{
          width: template.dimensions.width * scale,
          height: template.dimensions.height * scale,
        }}
      >
        Loading canvas preview...
      </div>
    );
  }

  const page = template.pages.find((p) => p.page_index === pageIndex) || template.pages[0];
  const { width, height } = template.dimensions;

  return (
    <div className={`overflow-hidden rounded-lg shadow-md ${className}`}>
      <Stage width={width * scale} height={height * scale} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* Page Background */}
          {page.background.color && (
            <Rect x={0} y={0} width={width} height={height} fill={page.background.color} />
          )}

          {/* Render Elements */}
          {page.elements.map((rawEl) => {
            const el = resolveElement(rawEl, slotData, theme);

            if (el.type === "shape") {
              const shape = el as ShapeElement;
              if (shape.shape_type === "rect") {
                return (
                  <Rect
                    key={shape.id}
                    x={shape.x}
                    y={shape.y}
                    width={shape.width}
                    height={shape.height}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.stroke_width}
                    cornerRadius={shape.border_radius}
                    opacity={shape.opacity ?? 1}
                  />
                );
              }
              if (shape.shape_type === "circle") {
                const radius = Math.min(shape.width, shape.height) / 2;
                return (
                  <Circle
                    key={shape.id}
                    x={shape.x + radius}
                    y={shape.y + radius}
                    radius={radius}
                    fill={shape.fill}
                    stroke={shape.stroke}
                    strokeWidth={shape.stroke_width}
                    opacity={shape.opacity ?? 1}
                  />
                );
              }
              if (shape.shape_type === "line") {
                return (
                  <Line
                    key={shape.id}
                    points={[shape.x, shape.y, shape.x + shape.width, shape.y + shape.height]}
                    stroke={shape.stroke || "#000000"}
                    strokeWidth={shape.stroke_width || 1}
                    opacity={shape.opacity ?? 1}
                  />
                );
              }
            }

            if (el.type === "text") {
              const textEl = el as TextElement;
              const text = textEl.default_text || "";
              const layout = calculateTextLayout(text, textEl);

              return (
                <KonvaText
                  key={textEl.id}
                  x={textEl.x}
                  y={textEl.y}
                  width={textEl.width}
                  height={textEl.height}
                  text={layout.lines.join("\n")}
                  fontSize={layout.fontSize}
                  fontFamily={textEl.font_family || "Inter"}
                  fontStyle={textEl.font_weight === "bold" ? "bold" : "normal"}
                  fill={textEl.color || "#000000"}
                  align={textEl.text_align || "left"}
                  lineHeight={textEl.line_height || 1.3}
                  opacity={textEl.opacity ?? 1}
                />
              );
            }

            if (el.type === "image") {
              return <BrowserKonvaImage key={el.id} el={el as ImageElement} />;
            }

            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
}

