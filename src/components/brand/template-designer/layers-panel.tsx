"use client";

/**
 * Canvas Layers Stack Panel
 * Displays all elements in visual z-index order, enabling selection of obscured elements and layer reordering.
 * Can be rendered inside the Canva drawer or docked beside it.
 * System Layer: ui / brand / template-designer
 */

import React from "react";
import { TemplateElement } from "@/render/template-schema";
import { getFriendlyLabel } from "./layer-utils";

interface LayersPanelProps {
  elements: TemplateElement[];
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onDeleteElement: (id: string) => void;
  onClose?: () => void;
}

export function LayersPanel({
  elements,
  selectedId,
  onSelectElement,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDeleteElement,
  onClose,
}: LayersPanelProps): React.JSX.Element {
  // Elements are rendered array-order (index 0 = back, last = front).
  // In the UI layers stack, standard convention is Top = Front, Bottom = Back.
  // We reverse for display so the top item in the list is the topmost layer.
  const reversedLayers = [...elements].reverse();

  return (
    <div className="h-full flex flex-col bg-white select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
            <span>Layers</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600">
              {elements.length}
            </span>
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Top layer is in front</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            title="Close Layers Panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {reversedLayers.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-zinc-400 text-center px-4">
            No elements on this slide yet. Add shapes or text from the left.
          </div>
        ) : (
          reversedLayers.map((el, displayIdx) => {
            const isSelected = el.id === selectedId;
            const { title, category, icon } = getFriendlyLabel(el);
            const isTop = displayIdx === 0;
            const isBottom = displayIdx === reversedLayers.length - 1;

            return (
              <div
                key={el.id}
                onClick={() => onSelectElement(el.id)}
                className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                    : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white text-zinc-800"
                }`}
              >
                {/* Layer Icon & Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    className={`text-[10px] font-mono w-4 shrink-0 text-center ${
                      isSelected ? "text-zinc-400" : "text-zinc-400"
                    }`}
                  >
                    {reversedLayers.length - displayIdx}
                  </span>

                  <div className={`shrink-0 ${isSelected ? "text-white" : "text-zinc-500"}`}>
                    {icon === "text" && (
                      <span className="font-serif font-bold text-xs">T</span>
                    )}
                    {icon === "image" && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {icon === "shape" && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect width="18" height="18" x="3" y="3" rx="2" strokeWidth={1.75} />
                      </svg>
                    )}
                    {icon === "video" && (
                      <span className="text-xs">🎬</span>
                    )}
                    {icon === "captions" && (
                      <span className="text-xs">💬</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-semibold truncate">{title}</div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      {category}
                    </div>
                  </div>
                </div>

                {/* Layer Reorder Buttons */}
                <div
                  className={`flex items-center gap-0.5 shrink-0 ${
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    disabled={isTop}
                    onClick={() => onBringForward(el.id)}
                    title="Bring Forward"
                    className={`p-1 rounded ${
                      isSelected
                        ? "text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-20"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-20"
                    }`}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={isBottom}
                    onClick={() => onSendBackward(el.id)}
                    title="Send Backward"
                    className={`p-1 rounded ${
                      isSelected
                        ? "text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-20"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-20"
                    }`}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteElement(el.id)}
                    title="Delete Layer"
                    className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-500/10 ml-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
