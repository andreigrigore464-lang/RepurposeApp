"use client";

/**
 * Interactive Konva Canvas Stage
 * Renders draggable, resizable elements with smart snapping guides and transformer handles.
 * System Layer: ui / brand / template-designer
 */

import React, { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Text as KonvaText, Line, Transformer, Circle } from "react-konva";
import type Konva from "konva";
import {
  TemplateElement,
  TextElement,
  ShapeElement,
  ImageElement,
  VideoElement,
  CaptionsElement,
} from "@/render/template-schema";
import { BrandTheme } from "@/render/layout/resolve-slots";
import { SnapLine } from "./types";
import { calculateSnaps } from "./snap-calculator";
import { getSampleText } from "./layer-utils";

interface CanvasStageProps {
  width: number;
  height: number;
  elements: TemplateElement[];
  selectedId: string | null;
  backgroundColor: string;
  theme: BrandTheme;
  scale: number;
  onSelect: (id: string | null) => void;
  onChange: (elements: TemplateElement[]) => void;
}

export function CanvasStage({
  width,
  height,
  elements,
  selectedId,
  backgroundColor,
  theme,
  scale,
  onSelect,
  onChange,
}: CanvasStageProps): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [snapLines, setSnapLines] = useState<SnapLine[]>([]);
  const trRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update Transformer attachment when selection or elements change
  useEffect(() => {
    if (!trRef.current) return;
    if (selectedId && shapeRefs.current.has(selectedId)) {
      const selectedNode = shapeRefs.current.get(selectedId)!;
      trRef.current.nodes([selectedNode]);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current.nodes([]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  if (!mounted) {
    return (
      <div
        className="bg-zinc-100 flex items-center justify-center rounded-lg border border-app-border text-xs text-app-muted"
        style={{ width: width * scale, height: height * scale }}
      >
        Loading canvas designer...
      </div>
    );
  }

  const handleDragMove = (el: TemplateElement, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const snaps = calculateSnaps(
      {
        id: el.id,
        x: node.x(),
        y: node.y(),
        width: el.width,
        height: el.height,
      },
      width,
      height,
      elements
    );

    node.x(snaps.x);
    node.y(snaps.y);
    setSnapLines(snaps.lines);
  };

  const handleDragEnd = (el: TemplateElement, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    setSnapLines([]);

    const updated = elements.map((item) => {
      if (item.id === el.id) {
        return {
          ...item,
          x: Math.round(node.x()),
          y: Math.round(node.y()),
        };
      }
      return item;
    });

    onChange(updated);
  };

  const handleTransformEnd = (el: TemplateElement, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    setSnapLines([]);

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset node scale and bake into width/height
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(20, Math.round(el.width * scaleX));
    const newHeight = Math.max(20, Math.round(el.height * scaleY));

    const updated = elements.map((item) => {
      if (item.id === el.id) {
        return {
          ...item,
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: newWidth,
          height: newHeight,
        };
      }
      return item;
    });

    onChange(updated);
  };

  return (
    <div
      className="relative rounded-lg shadow-lg border border-app-border overflow-hidden select-none bg-app-surface"
      style={{ width: width * scale, height: height * scale }}
      onClick={(e) => {
        // If clicking background canvas, deselect
        if (e.target === e.currentTarget) {
          onSelect(null);
        }
      }}
    >
      <Stage
        width={width * scale}
        height={height * scale}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            onSelect(null);
          }
        }}
      >
        <Layer>
          {/* Canvas Background */}
          <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} />

          {/* Safe Margins Indicator (5% padding box) */}
          <Rect
            x={width * 0.05}
            y={height * 0.05}
            width={width * 0.9}
            height={height * 0.9}
            stroke="#94a3b8"
            strokeWidth={1}
            dash={[6, 6]}
            opacity={0.35}
            listening={false}
          />

          {/* Render Elements */}
          {elements.map((el) => {
            const isSelected = el.id === selectedId;

            if (el.type === "shape") {
              const shape = el as ShapeElement;
              return (
                <Rect
                  key={shape.id}
                  ref={(node) => {
                    if (node) shapeRefs.current.set(shape.id, node);
                    else shapeRefs.current.delete(shape.id);
                  }}
                  id={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill || theme.secondaryColor}
                  stroke={isSelected ? "#2563eb" : shape.stroke}
                  strokeWidth={isSelected ? 2 : shape.stroke_width || 0}
                  cornerRadius={shape.border_radius || 0}
                  opacity={shape.opacity ?? 1}
                  draggable
                  onClick={() => onSelect(shape.id)}
                  onTap={() => onSelect(shape.id)}
                  onDragMove={(e) => handleDragMove(shape, e)}
                  onDragEnd={(e) => handleDragEnd(shape, e)}
                  onTransformEnd={(e) => handleTransformEnd(shape, e)}
                />
              );
            }

            if (el.type === "text") {
              const text = el as TextElement;
              const displayText = getSampleText(text);
              const fontFamily =
                text.font_family === "Playfair Display"
                  ? theme.fontHeading
                  : text.font_family || theme.fontBody;

              return (
                <KonvaText
                  key={text.id}
                  ref={(node) => {
                    if (node) shapeRefs.current.set(text.id, node);
                    else shapeRefs.current.delete(text.id);
                  }}
                  id={text.id}
                  x={text.x}
                  y={text.y}
                  width={text.width}
                  height={text.height}
                  text={displayText}
                  fontSize={text.font_size}
                  fontFamily={fontFamily}
                  fontStyle={text.font_weight === "bold" ? "bold" : "normal"}
                  fill={text.color || theme.textColor}
                  align={text.text_align || "left"}
                  lineHeight={text.line_height || 1.3}
                  opacity={text.opacity ?? 1}
                  draggable
                  onClick={() => onSelect(text.id)}
                  onTap={() => onSelect(text.id)}
                  onDragMove={(e) => handleDragMove(text, e)}
                  onDragEnd={(e) => handleDragEnd(text, e)}
                  onTransformEnd={(e) => handleTransformEnd(text, e)}
                />
              );
            }

            if (el.type === "image") {
              const img = el as ImageElement;
              return (
                <Rect
                  key={img.id}
                  ref={(node) => {
                    if (node) shapeRefs.current.set(img.id, node);
                    else shapeRefs.current.delete(img.id);
                  }}
                  id={img.id}
                  x={img.x}
                  y={img.y}
                  width={img.width}
                  height={img.height}
                  fill="#f4f4f5"
                  stroke={isSelected ? "#2563eb" : "#cbd5e1"}
                  strokeWidth={isSelected ? 2 : 1.5}
                  dash={[6, 6]}
                  cornerRadius={img.border_radius || 8}
                  draggable
                  onClick={() => onSelect(img.id)}
                  onTap={() => onSelect(img.id)}
                  onDragMove={(e) => handleDragMove(img, e)}
                  onDragEnd={(e) => handleDragEnd(img, e)}
                  onTransformEnd={(e) => handleTransformEnd(img, e)}
                />
              );
            }

            if (el.type === "video") {
              const vid = el as VideoElement;
              const isBlur = (vid.blur_px ?? 0) > 0;
              return (
                <React.Fragment key={vid.id}>
                  <Rect
                    ref={(node) => {
                      if (node) shapeRefs.current.set(vid.id, node);
                      else shapeRefs.current.delete(vid.id);
                    }}
                    id={vid.id}
                    x={vid.x}
                    y={vid.y}
                    width={vid.width}
                    height={vid.height}
                    fill={isBlur ? "#18181b" : "#27272a"}
                    stroke={isSelected ? "#2563eb" : isBlur ? "#3f3f46" : "#71717a"}
                    strokeWidth={isSelected ? 3 : 1.5}
                    cornerRadius={vid.border_radius || 0}
                    opacity={vid.opacity ?? 1}
                    draggable
                    onClick={() => onSelect(vid.id)}
                    onTap={() => onSelect(vid.id)}
                    onDragMove={(e) => handleDragMove(vid, e)}
                    onDragEnd={(e) => handleDragEnd(vid, e)}
                    onTransformEnd={(e) => handleTransformEnd(vid, e)}
                  />
                  <KonvaText
                    x={vid.x + 20}
                    y={vid.y + vid.height / 2 - 14}
                    width={vid.width - 40}
                    text={
                      isBlur
                        ? `🎥 Blurred Video Background (${vid.blur_px}px blur)`
                        : `🎬 Main Video Feed (${vid.framing_mode})`
                    }
                    fontSize={22}
                    fontFamily="Inter, sans-serif"
                    fontStyle="bold"
                    fill={isBlur ? "#71717a" : "#f4f4f5"}
                    align="center"
                    listening={false}
                  />
                </React.Fragment>
              );
            }

            if (el.type === "captions") {
              const cap = el as CaptionsElement;
              const displayText =
                cap.uppercase !== false
                  ? "THIS IS HOW ACTIVE KARAOKE CAPTIONS LOOK"
                  : "This is how active karaoke captions look";

              return (
                <React.Fragment key={cap.id}>
                  <Rect
                    ref={(node) => {
                      if (node) shapeRefs.current.set(cap.id, node);
                      else shapeRefs.current.delete(cap.id);
                    }}
                    id={cap.id}
                    x={cap.x}
                    y={cap.y}
                    width={cap.width}
                    height={cap.height}
                    fill="transparent"
                    stroke={isSelected ? "#2563eb" : "rgba(255,255,255,0.2)"}
                    strokeWidth={isSelected ? 2 : 1}
                    dash={[6, 6]}
                    draggable
                    onClick={() => onSelect(cap.id)}
                    onTap={() => onSelect(cap.id)}
                    onDragMove={(e) => handleDragMove(cap, e)}
                    onDragEnd={(e) => handleDragEnd(cap, e)}
                    onTransformEnd={(e) => handleTransformEnd(cap, e)}
                  />
                  <KonvaText
                    x={cap.x + 10}
                    y={cap.y + 10}
                    width={cap.width - 20}
                    height={cap.height - 20}
                    text={displayText}
                    fontSize={cap.font_size}
                    fontFamily={cap.font_family || "Anton"}
                    fontStyle="bold"
                    fill={cap.highlight_color || "#FFDE00"}
                    stroke={cap.outline_color || "#000000"}
                    strokeWidth={Math.min(cap.outline_width || 6, 8)}
                    fillAfterStrokeEnabled
                    align={cap.text_align || "center"}
                    lineHeight={1.2}
                    listening={false}
                  />
                </React.Fragment>
              );
            }

            return null;
          })}

          {/* Magnetic Snap Guide Lines */}
          {snapLines.map((line, idx) => {
            const strokeColor =
              line.type === "center" ? "#06b6d4" : line.type === "margin" ? "#ec4899" : "#f59e0b";

            const points =
              line.orientation === "vertical"
                ? [line.position, line.start, line.position, line.end]
                : [line.start, line.position, line.end, line.position];

            return (
              <Line
                key={`snap-${idx}`}
                points={points}
                stroke={strokeColor}
                strokeWidth={1.5}
                dash={[4, 4]}
                listening={false}
              />
            );
          })}

          {/* Konva Transformer for Selected Element */}
          <Transformer
            ref={trRef}
            flipEnabled={false}
            rotateEnabled={false}
            enabledAnchors={[
              "top-left",
              "top-right",
              "bottom-left",
              "bottom-right",
              "middle-left",
              "middle-right",
            ]}
            boundBoxFunc={(oldBox, newBox) => {
              if (Math.abs(newBox.width) < 20 || Math.abs(newBox.height) < 20) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}

