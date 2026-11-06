"use client";

/**
 * Visual Template Designer
 * Interactive drag-and-drop workspace for crafting and customizing master templates.
 * System Layer: ui / brand / template-designer
 */

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Template, TemplateElement } from "@/render/template-schema";
import { BrandTheme } from "@/render/layout/resolve-slots";
import { UserTemplateRecord } from "@/db/queries-brand-kit";
import { ArchetypeId, ArchetypeConfig, AvailableSlot, AspectRatioType, ASPECT_RATIOS } from "./types";
import { SlotPalette } from "./slot-palette";
import { LayersPanel } from "./layers-panel";
import { ElementPropertiesPanel } from "./element-properties-panel";
import { BrandStyleTab } from "./brand-style-tab";

// Dynamically import CanvasStage with SSR disabled for Konva
const CanvasStage = dynamic(
  () => import("./canvas-stage").then((mod) => mod.CanvasStage),
  {
    ssr: false,
    loading: () => (
      <div className="h-[540px] w-[540px] bg-app-subtle flex items-center justify-center rounded-lg border border-app-border text-xs text-app-muted">
        Loading canvas editor...
      </div>
    ),
  }
);

const CAROUSEL_ARCHETYPES: ArchetypeConfig[] = [
  {
    id: "carousel-cover",
    label: "Cover Slide",
    format: "carousel",
    pageIndex: 0,
    description: "Slide 1: Deck title, kicker, and cover hero visual",
  },
  {
    id: "carousel-body",
    label: "Takeaway Slide",
    format: "carousel",
    pageIndex: 1,
    description: "Slide 2-N: Core takeaway findings and grounded explanation",
  },
  {
    id: "carousel-closing",
    label: "Closing Slide",
    format: "carousel",
    pageIndex: 2,
    description: "Final slide: Executive summary and editorial call-to-action",
  },
];

interface TemplateDesignerProps {
  templateRecord: UserTemplateRecord;
  initialBrandTheme: BrandTheme;
  initialVoiceGuidelines?: string;
  onSave: (
    updatedRecord: UserTemplateRecord,
    updatedTheme: BrandTheme,
    updatedVoice: string
  ) => Promise<void>;
  onBack: () => void;
}

export function TemplateDesigner({
  templateRecord,
  initialBrandTheme,
  initialVoiceGuidelines = "",
  onSave,
  onBack,
}: TemplateDesignerProps): React.JSX.Element {
  const isVideoReel = templateRecord.format === "video-reel";
  const [templateName, setTemplateName] = useState(templateRecord.name);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>(
    isVideoReel ? "vertical" : (templateRecord.aspectRatio as AspectRatioType) || "square"
  );
  const [template, setTemplate] = useState<Template>(templateRecord.template);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // 3-tab sidebar: Layers | Slots | Brand Style
  const [sidebarTab, setSidebarTab] = useState<"layers" | "slots" | "style">("layers");

  // Live brand styling
  const [brandTheme, setBrandTheme] = useState<BrandTheme>(initialBrandTheme);
  const [voiceGuidelines, setVoiceGuidelines] = useState(initialVoiceGuidelines);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dimensions = ASPECT_RATIOS[aspectRatio];

  const activePage =
    template.pages.find((p) => p.page_index === activePageIndex) ||
    template.pages[0];

  const currentElements = activePage.elements;

  // Selected element for inspector
  const selectedElement =
    currentElements.find((el) => el.id === selectedElementId) || null;

  // Update elements for the active page
  const handleUpdateElements = (newElements: TemplateElement[]) => {
    setTemplate((prev) => ({
      ...prev,
      dimensions: { width: dimensions.width, height: dimensions.height },
      pages: prev.pages.map((p) =>
        p.page_index === activePageIndex ? { ...p, elements: newElements } : p
      ),
    }));
  };

  // Layer Reordering Handlers
  const handleBringForward = (id: string) => {
    const idx = currentElements.findIndex((el) => el.id === id);
    if (idx < 0 || idx >= currentElements.length - 1) return;
    const updated = [...currentElements];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    handleUpdateElements(updated);
  };

  const handleSendBackward = (id: string) => {
    const idx = currentElements.findIndex((el) => el.id === id);
    if (idx <= 0) return;
    const updated = [...currentElements];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    handleUpdateElements(updated);
  };

  const handleBringToFront = (id: string) => {
    const idx = currentElements.findIndex((el) => el.id === id);
    if (idx < 0 || idx === currentElements.length - 1) return;
    const el = currentElements[idx];
    const updated = currentElements.filter((item) => item.id !== id);
    updated.push(el);
    handleUpdateElements(updated);
  };

  const handleSendToBack = (id: string) => {
    const idx = currentElements.findIndex((el) => el.id === id);
    if (idx <= 0) return;
    const el = currentElements[idx];
    const updated = currentElements.filter((item) => item.id !== id);
    updated.unshift(el);
    handleUpdateElements(updated);
  };

  // Add slot from sidebar palette
  const handleAddSlot = (slotDef: AvailableSlot) => {
    const newId = `${slotDef.slot}-${Date.now().toString().slice(-4)}`;
    let newElement: TemplateElement;

    if (slotDef.type === "video") {
      const isBlur = slotDef.slot === "bg_video_blur";
      newElement = {
        id: newId,
        type: "video",
        slot: "source_video",
        x: 0,
        y: isBlur ? 0 : 550,
        width: slotDef.defaultWidth,
        height: slotDef.defaultHeight,
        framing_mode: isBlur ? "blurred_stack" : "ai_face_focus",
        blur_px: isBlur ? 55 : 0,
        brightness: isBlur ? 0.45 : 1,
        border_radius: 0,
        opacity: 1,
      };
    } else if (slotDef.type === "captions") {
      newElement = {
        id: newId,
        type: "captions",
        slot: "captions",
        x: 60,
        y: 1280,
        width: slotDef.defaultWidth,
        height: slotDef.defaultHeight,
        font_family: "Anton",
        font_size: slotDef.defaultFontSize || 84,
        primary_color: "#FFFFFF",
        highlight_color: "#FFDE00",
        outline_color: "#000000",
        outline_width: 8,
        shadow_depth: 4,
        words_per_phrase: 4,
        uppercase: true,
        text_align: "center",
      };
    } else if (slotDef.type === "text") {
      newElement = {
        id: newId,
        type: "text",
        slot: slotDef.slot,
        default_text: slotDef.defaultText || `[${slotDef.label}]`,
        x: 100,
        y: 200,
        width: slotDef.defaultWidth,
        height: slotDef.defaultHeight,
        font_size: slotDef.defaultFontSize || 32,
        font_family: "Inter",
        font_weight: "normal",
        color: brandTheme.textColor,
      };
    } else if (slotDef.type === "shape") {
      newElement = {
        id: newId,
        type: "shape",
        shape_type: "rect",
        x: 100,
        y: 100,
        width: slotDef.defaultWidth,
        height: slotDef.defaultHeight,
        fill: brandTheme.secondaryColor,
        border_radius: 8,
      };
    } else {
      newElement = {
        id: newId,
        type: "image",
        slot: slotDef.slot,
        x: 100,
        y: 300,
        width: slotDef.defaultWidth,
        height: slotDef.defaultHeight,
        border_radius: 8,
      };
    }

    handleUpdateElements([...currentElements, newElement]);
    setSelectedElementId(newId);
  };

  // Delete element
  const handleDeleteElement = (id: string) => {
    handleUpdateElements(currentElements.filter((el) => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  // Save template and brand settings
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      const updatedRecord: UserTemplateRecord = {
        ...templateRecord,
        name: templateName.trim() || "Untitled Template",
        isActive: false,
        aspectRatio,
        updatedAt: new Date().toISOString(),
        template: {
          ...template,
          name: templateName.trim() || "Untitled Template",
          dimensions: { width: dimensions.width, height: dimensions.height },
        },
      };

      await onSave(updatedRecord, brandTheme, voiceGuidelines);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save template.");
    } finally {
      setSaving(false);
    }
  };

  // Determine active archetype ID for slot palette
  const getActiveArchetypeId = (): ArchetypeId => {
    if (templateRecord.format === "video-reel") return "video-reel";
    if (templateRecord.format === "card") return "card";
    if (activePageIndex === 0) return "carousel-cover";
    if (activePageIndex === 1) return "carousel-body";
    return "carousel-closing";
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Bar */}
      <div className="bg-app-surface border border-app-border rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Back & Template Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-md text-app-muted hover:text-app-ink hover:bg-app-subtle transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>

          <div className="h-5 w-px bg-app-border" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name..."
              className="font-serif font-bold text-sm text-app-ink bg-transparent border-b border-dashed border-app-border focus:border-app-accent focus:outline-none px-1 py-0.5"
            />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-app-border bg-app-subtle uppercase text-app-muted shrink-0">
              {templateRecord.format}
            </span>
          </div>
        </div>

        {/* Center: Carousel Slide Archetypes (if carousel) */}
        {templateRecord.format === "carousel" && (
          <div className="flex items-center gap-1 border border-app-border rounded-md bg-app-subtle/30 p-1">
            {CAROUSEL_ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                onClick={() => {
                  setActivePageIndex(arch.pageIndex);
                  setSelectedElementId(null);
                }}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  activePageIndex === arch.pageIndex
                    ? "bg-app-surface text-app-ink font-semibold shadow-xs"
                    : "text-app-muted hover:text-app-ink"
                }`}
              >
                {arch.label}
              </button>
            ))}
          </div>
        )}

        {/* Right: Aspect Ratio, Active Checkbox & Save */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Aspect Ratio Switcher */}
          {isVideoReel ? (
            <div className="flex items-center gap-1 border border-app-border rounded-md bg-app-subtle/50 px-2.5 py-1 text-[11px] font-semibold text-app-ink">
              <span>🎬 9:16 Vertical Reel (1080×1920)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 border border-app-border rounded-md bg-app-subtle/30 p-1">
              <button
                onClick={() => setAspectRatio("square")}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  aspectRatio === "square"
                    ? "bg-app-surface text-app-ink font-semibold shadow-xs"
                    : "text-app-muted hover:text-app-ink"
                }`}
              >
                1:1 Square
              </button>
              <button
                onClick={() => setAspectRatio("portrait")}
                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                  aspectRatio === "portrait"
                    ? "bg-app-surface text-app-ink font-semibold shadow-xs"
                    : "text-app-muted hover:text-app-ink"
                }`}
              >
                4:5 Portrait
              </button>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-app-ink px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 font-medium">
          ✓ Template saved successfully!
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800 font-medium">
          ✕ {errorMsg}
        </div>
      )}

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3-Tab Sidebar (Layers | Slots | Brand Style) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center border border-app-border rounded-lg bg-app-surface p-1 shadow-xs text-xs font-medium">
            <button
              onClick={() => setSidebarTab("layers")}
              className={`flex-1 py-1.5 rounded-md transition-colors text-center ${
                sidebarTab === "layers"
                  ? "bg-app-subtle text-app-ink font-semibold shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Layers ({currentElements.length})
            </button>
            <button
              onClick={() => setSidebarTab("slots")}
              className={`flex-1 py-1.5 rounded-md transition-colors text-center ${
                sidebarTab === "slots"
                  ? "bg-app-subtle text-app-ink font-semibold shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              + Slots
            </button>
            <button
              onClick={() => setSidebarTab("style")}
              className={`flex-1 py-1.5 rounded-md transition-colors text-center ${
                sidebarTab === "style"
                  ? "bg-app-subtle text-app-ink font-semibold shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Brand Style
            </button>
          </div>

          {sidebarTab === "layers" && (
            <LayersPanel
              elements={currentElements}
              selectedId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onDeleteElement={handleDeleteElement}
            />
          )}

          {sidebarTab === "slots" && (
            <SlotPalette
              archetypeId={getActiveArchetypeId()}
              elements={currentElements}
              selectedId={selectedElementId}
              onSelectElement={(id) => {
                setSelectedElementId(id);
                setSidebarTab("layers");
              }}
              onAddSlot={handleAddSlot}
            />
          )}

          {sidebarTab === "style" && (
            <BrandStyleTab
              theme={brandTheme}
              voiceGuidelines={voiceGuidelines}
              onThemeChange={setBrandTheme}
              onVoiceChange={setVoiceGuidelines}
            />
          )}

          {/* Properties Inspector always available below the active tab */}
          <ElementPropertiesPanel
            element={selectedElement}
            theme={brandTheme}
            onChange={(updated) => {
              handleUpdateElements(
                currentElements.map((el) => (el.id === updated.id ? updated : el))
              );
            }}
            onDelete={handleDeleteElement}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
          />
        </div>

        {/* Right Column: Canvas Stage */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className="text-[11px] text-app-muted mb-2 flex items-center gap-4">
            <span>
              Canvas: <strong className="font-mono text-app-ink">{dimensions.width} × {dimensions.height}</strong>
            </span>
            <span>
              Guides: <span className="text-cyan-600 font-medium">Center</span> · <span className="text-pink-600 font-medium">Margins (5%)</span> · <span className="text-amber-600 font-medium">Alignment</span>
            </span>
          </div>

          <div className="p-4 bg-app-subtle/40 rounded-xl border border-app-border shadow-inner max-w-full overflow-auto">
            <CanvasStage
              width={dimensions.width}
              height={dimensions.height}
              elements={currentElements}
              selectedId={selectedElementId}
              backgroundColor={activePage.background.color || brandTheme.backgroundColor}
              theme={brandTheme}
              scale={
                aspectRatio === "vertical" ? 0.32 : aspectRatio === "square" ? 0.48 : 0.40
              }
              onSelect={(id) => setSelectedElementId(id)}
              onChange={handleUpdateElements}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
