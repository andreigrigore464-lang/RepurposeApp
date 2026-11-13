"use client";

/**
 * Visual Template Designer
 * Authentic Canva-style workspace with left icon dock, flyout drawers,
 * docked layers panel, top contextual toolbar, and centered floating canvas.
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
import { BrandStyleTab } from "./brand-style-tab";
import { TopContextualBar } from "./top-contextual-bar";
import { ElementsPalette } from "./elements-palette";

// Dynamically import CanvasStage with SSR disabled for Konva
const CanvasStage = dynamic(
  () => import("./canvas-stage").then((mod) => mod.CanvasStage),
  {
    ssr: false,
    loading: () => (
      <div className="h-[540px] w-[540px] bg-zinc-100 flex items-center justify-center rounded-lg border border-zinc-200 text-xs text-zinc-400">
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

  // Canva Left Dock State: "elements" | "slots" | "brand" | "layers" | null (closed)
  const [activeDock, setActiveDock] = useState<"elements" | "slots" | "brand" | "layers" | null>("elements");

  // Docked Layers Panel on the left (enabled by default so user sees elements + layers side by side)
  const [layersPinned, setLayersPinned] = useState<boolean>(true);

  // Zoom calculation helper
  const getFitZoom = (ratio: AspectRatioType): number => {
    if (ratio === "vertical") return 0.38;
    if (ratio === "square") return 0.58;
    return 0.48; // portrait
  };

  const [zoom, setZoom] = useState<number>(() =>
    getFitZoom(isVideoReel ? "vertical" : (templateRecord.aspectRatio as AspectRatioType) || "square")
  );
  const viewportRef = React.useRef<HTMLDivElement>(null);

  // Wheel Zoom Listener on Canvas Viewport
  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom((prev) => {
        const next = Math.round(prev * zoomFactor * 100) / 100;
        return Math.min(2.0, Math.max(0.15, next));
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, []);

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

  // Selected element for top contextual toolbar
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

  // Add direct shape or typography element from elements palette
  const handleAddDirectElement = (element: TemplateElement) => {
    handleUpdateElements([...currentElements, element]);
    setSelectedElementId(element.id);
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
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const updatedRecord: UserTemplateRecord = {
        ...templateRecord,
        name: templateName,
        aspectRatio,
        updatedAt: new Date().toISOString(),
        template: {
          ...template,
          name: templateName,
          dimensions: { width: dimensions.width, height: dimensions.height },
        },
      };

      await onSave(updatedRecord, brandTheme, voiceGuidelines);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save template");
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

  const toggleDock = (tab: "elements" | "slots" | "brand" | "layers") => {
    if (activeDock === tab) {
      setActiveDock(null); // Click again to close drawer
    } else {
      setActiveDock(tab);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#eef0f3] flex flex-col overflow-hidden text-zinc-900 font-sans">
      {/* 1. TOP APP BAR (Spans 100% of Viewport Width) */}
      <header className="h-14 bg-white border-b border-zinc-200 px-4 flex items-center justify-between shrink-0 z-30 shadow-xs">
        {/* Left: Back & Editable Template Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-2.5 py-1.5 rounded-md text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Exit Studio</span>
          </button>

          <div className="h-5 w-px bg-zinc-200" />

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name..."
              className="font-serif font-bold text-sm text-zinc-900 bg-transparent border-b border-dashed border-zinc-300 focus:border-zinc-900 focus:outline-none px-1 py-0.5"
            />
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-zinc-200 bg-zinc-100 uppercase text-zinc-600 shrink-0">
              {templateRecord.format}
            </span>
          </div>
        </div>

        {/* Center: Slide Archetypes (for multi-slide carousels) */}
        {templateRecord.format === "carousel" && (
          <div className="flex items-center gap-1 border border-zinc-200 rounded-lg bg-zinc-100/60 p-1">
            {CAROUSEL_ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                onClick={() => {
                  setActivePageIndex(arch.pageIndex);
                  setSelectedElementId(null);
                }}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  activePageIndex === arch.pageIndex
                    ? "bg-white text-zinc-900 font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {arch.label}
              </button>
            ))}
          </div>
        )}

        {/* Right: Aspect Ratio Toggle & Save Button */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>
          )}
          {errorMsg && (
            <span className="text-xs text-red-600 font-medium">✕ {errorMsg}</span>
          )}

          {isVideoReel ? (
            <div className="flex items-center gap-1.5 border border-zinc-200 rounded-md bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-800">
              <span>🎬 9:16 Vertical Reel</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 border border-zinc-200 rounded-lg bg-zinc-100/60 p-1">
              <button
                onClick={() => {
                  setAspectRatio("square");
                  setZoom(getFitZoom("square"));
                }}
                className={`rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  aspectRatio === "square"
                    ? "bg-white text-zinc-900 font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                1:1 Square
              </button>
              <button
                onClick={() => {
                  setAspectRatio("portrait");
                  setZoom(getFitZoom("portrait"));
                }}
                className={`rounded px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  aspectRatio === "portrait"
                    ? "bg-white text-zinc-900 font-semibold shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                4:5 Portrait
              </button>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* A. FAR-LEFT CANVA PRIMARY ICON DOCK (72px) */}
        <nav className="w-[72px] shrink-0 bg-[#0e1318] text-white flex flex-col items-center py-3 gap-2 z-20 select-none">
          {/* Elements Button */}
          <button
            type="button"
            onClick={() => toggleDock("elements")}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeDock === "elements"
                ? "bg-white/20 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Shapes & Elements"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth={2} />
              <circle cx="17.5" cy="6.5" r="3.5" strokeWidth={2} />
              <polygon points="12,14 18,21 6,21" strokeWidth={2} />
            </svg>
            <span className="text-[10px] font-medium tracking-tight">Elements</span>
          </button>

          {/* Slots Button */}
          <button
            type="button"
            onClick={() => toggleDock("slots")}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeDock === "slots"
                ? "bg-white/20 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Grounded Article Content Slots"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[10px] font-medium tracking-tight">{isVideoReel ? "Reel" : "Slots"}</span>
          </button>

          {/* Brand Style Button */}
          <button
            type="button"
            onClick={() => toggleDock("brand")}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeDock === "brand"
                ? "bg-white/20 text-white shadow-xs"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title="Brand Palette & Typography"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4 5 5 0 015-5 4 4 0 014 4 4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-[10px] font-medium tracking-tight">Brand</span>
          </button>

          <div className="w-8 h-px bg-white/10 my-1" />

          {/* Toggle Layers Dock Button */}
          <button
            type="button"
            onClick={() => setLayersPinned(!layersPinned)}
            className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              layersPinned
                ? "bg-white/25 text-white ring-1 ring-white/30"
                : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            title={layersPinned ? "Hide Layers on Left" : "Show Layers on Left"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-[10px] font-medium tracking-tight">Layers</span>
          </button>
        </nav>

        {/* B. CANVA EXPANDABLE DRAWER (320px) */}
        {activeDock && (
          <aside className="w-[320px] shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full z-10 shadow-xs">
            {/* Drawer Header */}
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between shrink-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                {activeDock === "elements" && "Elements & Shapes"}
                {activeDock === "slots" && (isVideoReel ? "Video Reel Tracks" : "Article Grounded Slots")}
                {activeDock === "brand" && "Brand Styling"}
                {activeDock === "layers" && "Layers Stack"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveDock(null)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
                title="Collapse Drawer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeDock === "elements" && (
                <ElementsPalette
                  theme={brandTheme}
                  onAddElement={handleAddDirectElement}
                />
              )}

              {activeDock === "slots" && (
                <SlotPalette
                  archetypeId={getActiveArchetypeId()}
                  elements={currentElements}
                  selectedId={selectedElementId}
                  onSelectElement={(id) => setSelectedElementId(id)}
                  onAddSlot={handleAddSlot}
                />
              )}

              {activeDock === "brand" && (
                <BrandStyleTab
                  theme={brandTheme}
                  voiceGuidelines={voiceGuidelines}
                  onThemeChange={setBrandTheme}
                  onVoiceChange={setVoiceGuidelines}
                />
              )}

              {activeDock === "layers" && (
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
            </div>
          </aside>
        )}

        {/* C. DOCKED LAYERS PANEL (260px) ON THE LEFT SIDE OF CANVAS */}
        {/* This allows displaying Element Adding AND Layers on the left simultaneously! */}
        {layersPinned && activeDock !== "layers" && (
          <aside className="w-[260px] shrink-0 bg-white border-r border-zinc-200 flex flex-col h-full z-10 shadow-2xs">
            <LayersPanel
              elements={currentElements}
              selectedId={selectedElementId}
              onSelectElement={(id) => setSelectedElementId(id)}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onBringToFront={handleBringToFront}
              onSendToBack={handleSendToBack}
              onDeleteElement={handleDeleteElement}
              onClose={() => setLayersPinned(false)}
            />
          </aside>
        )}

        {/* D. CANVAS WORKSPACE (CENTER & RIGHT) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#eef0f3]">
          {/* Top Contextual Property Bar */}
          <TopContextualBar
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

          {/* Centered Canvas Stage Viewport */}
          <div
            ref={viewportRef}
            className="flex-1 overflow-auto flex items-center justify-center p-8 relative"
          >
            <div className="flex flex-col items-center my-auto">
              {/* Guides / Dimensions Pill */}
              <div className="text-[11px] text-zinc-500 mb-3 flex items-center gap-3 bg-white/80 backdrop-blur-xs px-3.5 py-1 rounded-full border border-zinc-200 shadow-2xs">
                <span>
                  Canvas: <strong className="font-mono text-zinc-800">{dimensions.width} × {dimensions.height}</strong>
                </span>
                <span>·</span>
                <span>
                  Guides: <span className="text-cyan-600 font-semibold">Center</span> · <span className="text-pink-600 font-semibold">Margins (5%)</span> · <span className="text-amber-600 font-semibold">Alignment</span>
                </span>
              </div>

              {/* Canvas Card */}
              <div className="p-3 bg-white rounded-2xl shadow-xl border border-zinc-200/80 transition-transform duration-75">
                <CanvasStage
                  width={dimensions.width}
                  height={dimensions.height}
                  elements={currentElements}
                  selectedId={selectedElementId}
                  backgroundColor={activePage.background.color || brandTheme.backgroundColor}
                  theme={brandTheme}
                  scale={zoom}
                  onSelect={(id) => setSelectedElementId(id)}
                  onChange={handleUpdateElements}
                />
              </div>
            </div>

            {/* Canva-Style Floating Zoom Pill at Bottom Right */}
            <div className="absolute bottom-5 right-6 z-20 bg-white/95 backdrop-blur-xs border border-zinc-200 shadow-md rounded-full px-3 py-1.5 flex items-center gap-2 select-none">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(0.15, Math.round((prev - 0.08) * 100) / 100))}
                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-bold text-xs"
                title="Zoom Out (or Scroll Down)"
              >
                −
              </button>
              <input
                type="range"
                min="0.15"
                max="2.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-20 h-1.5 accent-zinc-900 cursor-pointer"
                title="Zoom Slider"
              />
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(2.0, Math.round((prev + 0.08) * 100) / 100))}
                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 font-bold text-xs"
                title="Zoom In (or Scroll Up)"
              >
                +
              </button>
              <span className="text-xs font-mono font-semibold text-zinc-800 min-w-[36px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <div className="h-3.5 w-px bg-zinc-200" />
              <button
                type="button"
                onClick={() => setZoom(getFitZoom(aspectRatio))}
                className="px-2 py-0.5 rounded text-[11px] font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                title="Fit Canvas to Viewport"
              >
                Fit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
