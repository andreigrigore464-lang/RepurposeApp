"use client";

/**
 * Canvas Layers Stack Panel
 * Displays all elements in visual z-index order, enabling selection of obscured elements and layer reordering.
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
}: LayersPanelProps): React.JSX.Element {
  // Elements are rendered array-order (index 0 = back, last = front).
  // In the UI layers stack, standard convention is Top = Front, Bottom = Back.
  // We reverse for display so the top item in the list is the topmost layer.
  const reversedLayers = [...elements].reverse();

  return (
    <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-app-ink">
            Layers Stack ({elements.length})
          </h3>
          <p className="text-[11px] text-app-muted mt-0.5">
            Top item is in front. Click any layer to select it on canvas.
          </p>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
        {reversedLayers.map((el, displayIdx) => {
          const isSelected = el.id === selectedId;
          const { title, category, icon } = getFriendlyLabel(el);
          const isTop = displayIdx === 0;
          const isBottom = displayIdx === reversedLayers.length - 1;

          return (
            <div
              key={el.id}
              onClick={() => onSelectElement(el.id)}
              className={`group flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                isSelected
                  ? "border-app-accent bg-app-accent/5 ring-1 ring-app-accent"
                  : "border-app-border hover:bg-app-subtle/40 bg-app-surface"
              }`}
            >
              {/* Layer Title & Type */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-[11px] text-app-muted font-mono w-4 shrink-0 text-center">
                  {reversedLayers.length - displayIdx}
                </span>

                <div className="shrink-0 text-app-muted">
                  {icon === "text" && (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h10M4 18h14" />
                    </svg>
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
                </div>

                <div className="min-w-0">
                  <div className="font-medium text-app-ink truncate">{title}</div>
                  <div className="text-[10px] text-app-muted truncate">{category}</div>
                </div>
              </div>

              {/* Layer Controls: Reorder & Delete */}
              <div
                className={`flex items-center gap-0.5 shrink-0 ${
                  isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                } transition-opacity`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Bring Forward (up in UI list) */}
                <button
                  type="button"
                  disabled={isTop}
                  onClick={() => onBringForward(el.id)}
                  title="Bring Forward"
                  className="p-1 rounded text-app-muted hover:text-app-ink hover:bg-app-subtle disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Send Backward (down in UI list) */}
                <button
                  type="button"
                  disabled={isBottom}
                  onClick={() => onSendBackward(el.id)}
                  title="Send Backward"
                  className="p-1 rounded text-app-muted hover:text-app-ink hover:bg-app-subtle disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => onDeleteElement(el.id)}
                  title="Remove Layer"
                  className="p-1 rounded text-app-muted hover:text-red-600 hover:bg-red-50"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

