"use client";

/**
 * Workflow YouTube Configuration Fields
 * Settings for recurring YouTube channel workflows: reel templates, clip counts, duration, and vocab.
 * System Layer: ui / feeds
 */

import React, { useState } from "react";
import { UserTemplateRecord } from "@/db/queries-brand-kit";

interface WorkflowYoutubeFieldsProps {
  templates: UserTemplateRecord[];
  videoReelTemplateId?: string;
  onSelectVideoReelTemplateId: (id?: string) => void;
  clipsCount: number;
  onChangeClipsCount: (count: number) => void;
  targetDuration: "15-30" | "30-60" | "60-90";
  onChangeTargetDuration: (dur: "15-30" | "30-60" | "60-90") => void;
  language?: string;
  onChangeLanguage: (lang: string) => void;
  vocabularyHint?: string;
  onChangeVocabularyHint: (hint: string) => void;
}

export function WorkflowYoutubeFields({
  templates,
  videoReelTemplateId,
  onSelectVideoReelTemplateId,
  clipsCount,
  onChangeClipsCount,
  targetDuration,
  onChangeTargetDuration,
  language,
  onChangeLanguage,
  vocabularyHint,
  onChangeVocabularyHint,
}: WorkflowYoutubeFieldsProps): React.JSX.Element {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const videoTemplates = templates.filter((t) => t.format === "video-reel");

  return (
    <div className="space-y-4 pt-3 border-t border-app-border/60">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-app-ink block font-mono uppercase tracking-wider text-app-muted">
          Video Reel Automation Settings
        </label>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">
          YouTube Reels
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Template Selector */}
        <div>
          <label className="text-xs font-semibold text-app-ink block mb-1">
            Visual Reel Template
          </label>
          <select
            value={videoReelTemplateId || "default"}
            onChange={(e) =>
              onSelectVideoReelTemplateId(
                e.target.value === "default" ? undefined : e.target.value
              )
            }
            className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
          >
            <option value="default">Default Podcast Reel (9:16)</option>
            {videoTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (9:16)
              </option>
            ))}
          </select>
        </div>

        {/* Target Duration */}
        <div>
          <label className="text-xs font-semibold text-app-ink block mb-1">
            Target Clip Duration
          </label>
          <select
            value={targetDuration}
            onChange={(e) => onChangeTargetDuration(e.target.value as any)}
            className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
          >
            <option value="15-30">15 – 30 seconds (Punchy Hooks)</option>
            <option value="30-60">30 – 60 seconds (Standard Shorts)</option>
            <option value="60-90">60 – 90 seconds (In-Depth Discussions)</option>
          </select>
        </div>
      </div>

      {/* Number of Clips */}
      <div className="p-3.5 rounded-lg border border-app-border bg-app-subtle/30 space-y-1.5">
        <span className="text-xs font-medium text-app-ink block">
          Clips to Cut per New Video
        </span>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((cnt) => (
            <button
              key={cnt}
              type="button"
              onClick={() => onChangeClipsCount(cnt)}
              className={`px-3 py-1 text-xs rounded border transition-colors ${
                clipsCount === cnt
                  ? "bg-app-ink text-white font-bold border-app-ink shadow-2xs"
                  : "bg-app-surface text-app-muted border-app-border hover:text-app-ink"
              }`}
            >
              {cnt}
            </button>
          ))}
          <span className="text-[11px] text-app-muted ml-2">
            AI automatically extracts top {clipsCount} complete-thought hooks.
          </span>
        </div>
      </div>

      {/* Advanced Transcription Settings */}
      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-app-muted hover:text-app-ink flex items-center gap-1 font-medium transition-colors"
        >
          <span>{showAdvanced ? "▼" : "▶"}</span>
          <span>Advanced Settings (Language & Studio Vocabulary Hint)</span>
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5 p-3 rounded-lg border border-app-border bg-app-subtle/20">
            <div>
              <label className="text-[11px] font-semibold text-app-ink block mb-1">
                Audio Language Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ro, en, fr (leave blank for auto)"
                value={language || ""}
                onChange={(e) => onChangeLanguage(e.target.value)}
                className="w-full text-xs rounded border border-app-border bg-app-surface px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-app-ink block mb-1">
                Vocabulary Hint (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPB Drive, Politehnica"
                value={vocabularyHint || ""}
                onChange={(e) => onChangeVocabularyHint(e.target.value)}
                className="w-full text-xs rounded border border-app-border bg-app-surface px-2.5 py-1.5"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

