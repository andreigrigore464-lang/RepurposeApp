"use client";

/**
 * Video Reel Settings Component
 * Configures reel templates, hook discovery mode, clip durations, and Whisper transcription hints.
 * System Layer: ui / repurpose
 */

import React, { useState } from "react";
import { UserTemplateRecord } from "@/db/queries-brand-kit";
import { ManualTimestamp } from "@/components/repurpose/types";

export type FramingMode = "smart_zoom" | "blurred_background" | "center_crop";

interface VideoReelSettingsProps {
  templates: UserTemplateRecord[];
  selectedTemplateId: string;
  onSelectTemplateId: (id: string) => void;
  framingMode: FramingMode;
  onChangeFramingMode: (mode: FramingMode) => void;
  topMargin: number;
  onChangeTopMargin: (val: number) => void;
  bottomMargin: number;
  onChangeBottomMargin: (val: number) => void;
  clipMode: "ai_auto" | "manual";
  onChangeClipMode: (mode: "ai_auto" | "manual") => void;
  clipsCount: number;
  onChangeClipsCount: (count: number) => void;
  targetDuration: "15-30" | "30-60" | "60-90";
  onChangeTargetDuration: (duration: "15-30" | "30-60" | "60-90") => void;
  manualTimestamps: ManualTimestamp[];
  onChangeManualTimestamps: (timestamps: ManualTimestamp[]) => void;
  language: string;
  onChangeLanguage: (val: string) => void;
  vocabularyHint: string;
  onChangeVocabularyHint: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function VideoReelSettings({
  templates,
  selectedTemplateId,
  onSelectTemplateId,
  framingMode,
  onChangeFramingMode,
  topMargin,
  onChangeTopMargin,
  bottomMargin,
  onChangeBottomMargin,
  clipMode,
  onChangeClipMode,
  clipsCount,
  onChangeClipsCount,
  targetDuration,
  onChangeTargetDuration,
  manualTimestamps,
  onChangeManualTimestamps,
  language,
  onChangeLanguage,
  vocabularyHint,
  onChangeVocabularyHint,
  isSubmitting,
  onSubmit,
}: VideoReelSettingsProps): React.JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const videoTemplates = templates.filter((t) => t.format === "video-reel");

  return (
    <div className="border-t border-app-border pt-5 space-y-4">
      <h3 className="text-xs font-semibold font-mono uppercase tracking-wider text-app-muted">
        Reel Generation Settings
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Template Selector */}
        <div>
          <label className="block text-xs font-medium text-app-ink mb-1">
            Visual Reel Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplateId(e.target.value)}
            className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink focus:outline-none focus:ring-1 focus:ring-app-accent"
          >
            <optgroup label="Reel Templates">
              <option value="preset:smart_zoom">🎯 Default (Smart Subject Zoom 9:16)</option>
              <option value="preset:blurred_background">🌫️ Ambient Blurred Background (Full 16:9)</option>
              <option value="preset:center_crop">✂️ Clean Center Crop (Static 9:16)</option>
            </optgroup>

            {videoTemplates.length > 0 && (
              <optgroup label="Saved Brand Templates">
                {videoTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    🎨 {t.name} (9:16)
                  </option>
                ))}
              </optgroup>
            )}

            <optgroup label="Advanced">
              <option value="manual">⚙️ Custom (Manual Framing & Margins)</option>
            </optgroup>
          </select>
        </div>

        {/* Clip Mode Switcher */}
        <div>
          <label className="block text-xs font-medium text-app-ink mb-1">
            Clip Selection Mode
          </label>
          <div className="flex rounded-md border border-app-border p-0.5 bg-app-subtle/30">
            <button
              type="button"
              onClick={() => onChangeClipMode("ai_auto")}
              className={`flex-1 py-1.5 text-xs font-medium rounded ${
                clipMode === "ai_auto"
                  ? "bg-app-surface text-app-ink font-semibold shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              AI Auto-Hooks
            </button>
            <button
              type="button"
              onClick={() => onChangeClipMode("manual")}
              className={`flex-1 py-1.5 text-xs font-medium rounded ${
                clipMode === "manual"
                  ? "bg-app-surface text-app-ink font-semibold shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Manual Timestamps
            </button>
          </div>
        </div>
      </div>

      {/* Template Visual Layout Preview (Option A: Template owns visual presentation) */}
      {selectedTemplateId !== "manual" ? (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-app-subtle/20 border border-app-border text-xs">
          <div className="flex items-center gap-2 text-app-muted">
            <span className="font-semibold text-app-ink">
              {selectedTemplateId === "preset:blurred_background"
                ? "🌫️ Ambient Blurred Background"
                : selectedTemplateId === "preset:center_crop"
                ? "✂️ Fixed Center Crop"
                : videoTemplates.find((t) => t.id === selectedTemplateId)?.name
                ? `🎨 ${videoTemplates.find((t) => t.id === selectedTemplateId)?.name}`
                : "🎯 Smart Subject Zoom"}
            </span>
            <span>•</span>
            <span className="text-[11px]">
              {selectedTemplateId === "preset:blurred_background"
                ? "Preserves complete 16:9 widescreen frame with blurred background bars"
                : selectedTemplateId === "preset:center_crop"
                ? "Static 9:16 vertical crop centered down the middle"
                : videoTemplates.find((t) => t.id === selectedTemplateId)
                ? "Layout, safe areas & typography defined in Template Designer"
                : "AI face & speaker tracking keeps subjects centered in full vertical 9:16"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTemplateId("manual")}
            className="text-[11px] text-app-accent hover:underline font-medium shrink-0 ml-3"
          >
            Customize
          </button>
        </div>
      ) : (
        /* Manual Framing & Margins Override Panel */
        <div className="p-4 rounded-lg bg-app-subtle/20 border border-app-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-app-ink">
              Manual 9:16 Framing Strategy
            </label>
            <button
              type="button"
              onClick={() => onSelectTemplateId("preset:smart_zoom")}
              className="text-[11px] text-app-muted hover:text-app-ink"
            >
              ✕ Use Preset Template
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onChangeFramingMode("smart_zoom")}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                framingMode === "smart_zoom"
                  ? "border-app-accent bg-app-accent/10 shadow-xs"
                  : "border-app-border bg-app-surface hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-app-ink">
                <span>🎯</span>
                <span>Smart Subject Zoom</span>
              </div>
              <p className="text-[11px] text-app-muted mt-1 leading-tight">
                AI face tracking keeps active speakers centered.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeFramingMode("blurred_background")}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                framingMode === "blurred_background"
                  ? "border-app-accent bg-app-accent/10 shadow-xs"
                  : "border-app-border bg-app-surface hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-app-ink">
                <span>🌫️</span>
                <span>Blurred Background</span>
              </div>
              <p className="text-[11px] text-app-muted mt-1 leading-tight">
                Full 16:9 widescreen frame with blurred bars.
              </p>
            </button>

            <button
              type="button"
              onClick={() => onChangeFramingMode("center_crop")}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                framingMode === "center_crop"
                  ? "border-app-accent bg-app-accent/10 shadow-xs"
                  : "border-app-border bg-app-surface hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-app-ink">
                <span>✂️</span>
                <span>Center Crop</span>
              </div>
              <p className="text-[11px] text-app-muted mt-1 leading-tight">
                Fixed 9:16 slice down the center.
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-app-border/50">
            <div>
              <label className="block text-[11px] font-semibold text-app-ink mb-1">
                Top Safe Margin (px)
              </label>
              <input
                type="number"
                min="0"
                max="600"
                step="10"
                placeholder="0"
                value={topMargin || ""}
                onChange={(e) => onChangeTopMargin(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-mono"
              />
              <p className="text-[10px] text-app-muted mt-1">Leaves room at top for headline or title banners.</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-app-ink mb-1">
                Bottom Safe Margin (px)
              </label>
              <input
                type="number"
                min="0"
                max="600"
                step="10"
                placeholder="0"
                value={bottomMargin || ""}
                onChange={(e) => onChangeBottomMargin(parseInt(e.target.value) || 0)}
                className="w-full rounded border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-mono"
              />
              <p className="text-[10px] text-app-muted mt-1">Leaves room at bottom for captions overlay.</p>
            </div>
          </div>
        </div>
      )}

      {clipMode === "ai_auto" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-app-subtle/20 border border-app-border">
          <div>
            <span className="text-xs font-medium text-app-ink block mb-1">
              Number of Clips to Generate
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => onChangeClipsCount(count)}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    clipsCount === count
                      ? "bg-app-ink text-white font-bold border-app-ink"
                      : "bg-app-surface text-app-muted border-app-border hover:text-app-ink"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-app-ink block mb-1">
              Target Clip Duration
            </span>
            <select
              value={targetDuration}
              onChange={(e) => onChangeTargetDuration(e.target.value as any)}
              className="w-full rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs text-app-ink"
            >
              <option value="15-30">15 – 30 seconds (Quick Punchy Hooks)</option>
              <option value="30-60">30 – 60 seconds (Standard Reels / Shorts)</option>
              <option value="60-90">60 – 90 seconds (In-Depth Discussions)</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-3 p-4 rounded-lg bg-app-subtle/20 border border-app-border">
          <span className="text-xs font-medium text-app-ink block">
            Define Clip Start & End Timestamps
          </span>
          {manualTimestamps.map((ts, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-app-muted w-14">
                Clip #{idx + 1}:
              </span>
              <input
                type="text"
                placeholder="01:04"
                value={ts.start}
                onChange={(e) => {
                  const next = [...manualTimestamps];
                  next[idx].start = e.target.value;
                  onChangeManualTimestamps(next);
                }}
                className="w-24 rounded border border-app-border bg-app-surface px-2 py-1 text-xs font-mono"
              />
              <span className="text-xs text-app-muted">to</span>
              <input
                type="text"
                placeholder="01:46"
                value={ts.end}
                onChange={(e) => {
                  const next = [...manualTimestamps];
                  next[idx].end = e.target.value;
                  onChangeManualTimestamps(next);
                }}
                className="w-24 rounded border border-app-border bg-app-surface px-2 py-1 text-xs font-mono"
              />
              {manualTimestamps.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeManualTimestamps(manualTimestamps.filter((_, i) => i !== idx))
                  }
                  className="text-xs text-red-500 hover:text-red-700 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {manualTimestamps.length < 5 && (
            <button
              type="button"
              onClick={() =>
                onChangeManualTimestamps([...manualTimestamps, { start: "02:00", end: "02:45" }])
              }
              className="text-xs text-app-accent hover:underline font-medium"
            >
              + Add Another Clip Range
            </button>
          )}
        </div>
      )}

      {/* Advanced Transcription Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-app-muted hover:text-app-ink flex items-center gap-1 font-medium transition-colors"
        >
          <span>{showAdvanced ? "▼" : "▶"}</span>
          <span>Advanced Whisper Transcription Hints (Language & Vocabulary)</span>
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-4 rounded-lg bg-app-subtle/30 border border-app-border">
            <div>
              <label className="block text-[11px] font-semibold text-app-ink mb-1">
                Spoken Language Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ro, en, es, de, fr (leave blank for auto)"
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value)}
                className="w-full rounded border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-app-ink mb-1">
                Vocabulary & Proper Names Hint (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPB Drive, Politehnica, Formula Student"
                value={vocabularyHint}
                onChange={(e) => onChangeVocabularyHint(e.target.value)}
                className="w-full rounded border border-app-border bg-app-surface px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full rounded-lg bg-app-ink py-3 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Submitting Video Job...</span>
          ) : (
            <span>🎬 Start Repurposing ({clipMode === "ai_auto" ? `${clipsCount} Clips` : `${manualTimestamps.length} Clips`})</span>
          )}
        </button>
      </div>
    </div>
  );
}

