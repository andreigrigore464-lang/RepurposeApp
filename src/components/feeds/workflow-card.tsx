"use client";

/**
 * Workflow Studio Card Component
 * Displays a publishing workflow's visual pipeline (Source -> Templates -> Formats), activity heartbeat, and stream drawer.
 * System Layer: ui / feeds
 */

import React, { useState } from "react";
import { WorkflowRecord, UserTemplateRecord } from "@/db/queries-brand-kit";
import { FeedStreamDrawer } from "./feed-stream-drawer";

interface WorkflowCardProps {
  workflow: WorkflowRecord;
  cardTemplate?: UserTemplateRecord;
  carouselTemplate?: UserTemplateRecord;
  videoReelTemplate?: UserTemplateRecord;
  onToggleActive: (workflow: WorkflowRecord) => void;
  onEdit: (workflow: WorkflowRecord) => void;
  onDuplicate: (workflow: WorkflowRecord) => void;
  onDelete: (workflow: WorkflowRecord) => void;
  onPollNow: (workflow: WorkflowRecord) => void;
  isPolling?: boolean;
}

export function WorkflowCard({
  workflow,
  cardTemplate,
  carouselTemplate,
  videoReelTemplate,
  onToggleActive,
  onEdit,
  onDuplicate,
  onDelete,
  onPollNow,
  isPolling = false,
}: WorkflowCardProps): React.JSX.Element {
  const [streamOpen, setStreamOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isYoutube = workflow.sourceType === "youtube";

  // Swatch styling
  const swatchBg =
    cardTemplate?.template?.pages?.[0]?.background?.color || "#18181b";
  const isDark = swatchBg === "#18181b" || swatchBg === "#000000";

  return (
    <div
      className={`rounded-xl border bg-app-surface shadow-xs transition-all overflow-hidden ${
        workflow.isActive ? "border-app-border" : "border-app-border/60 opacity-75"
      }`}
    >
      {/* Top Header Row */}
      <div className="p-5 border-b border-app-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold border ${
                workflow.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}
            >
              {workflow.isActive ? "Active" : "Paused"}
            </span>
            {isYoutube && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                <span>🔴</span>
                <span>YouTube Channel</span>
              </span>
            )}
            <h3 className="font-serif text-base font-bold text-app-ink">
              {workflow.name}
            </h3>
          </div>
          <p className="text-xs text-app-muted mt-1 font-mono truncate max-w-lg">
            {workflow.feedUrl ? (
              <span>
                Monitors <span className="text-app-ink">{workflow.feedUrl}</span> • Polls every{" "}
                {workflow.pollIntervalMinutes || 60}m
              </span>
            ) : (
              <span>Ad-hoc & Manual Draft Workflow</span>
            )}
          </p>
        </div>

        {/* Top Controls: Active Toggle & Options Menu */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none text-app-ink">
            <input
              type="checkbox"
              checked={workflow.isActive}
              onChange={() => onToggleActive(workflow)}
              className="rounded border-app-border text-app-ink focus:ring-0"
            />
            <span className="text-xs">{workflow.isActive ? "Active" : "Paused"}</span>
          </label>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md border border-app-border text-app-muted hover:text-app-ink hover:bg-app-subtle transition-colors text-xs"
            >
              •••
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-36 rounded-md border border-app-border bg-app-surface py-1 shadow-lg z-20"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(workflow);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-app-ink hover:bg-app-subtle"
                >
                  Edit Workflow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(workflow);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-app-ink hover:bg-app-subtle"
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(workflow);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                >
                  Delete Workflow
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Pipeline Stage Flow */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-app-subtle/20 border-b border-app-border/70">
        {/* Step 1: Source Feed */}
        <div className="rounded-lg border border-app-border bg-app-surface p-3.5 space-y-1.5 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-app-muted font-semibold block">
            1. Source Input
          </span>
          <div className="font-serif font-bold text-xs text-app-ink truncate">
            {workflow.feedTitle || (workflow.feedUrl ? (isYoutube ? "YouTube Feed" : "Publication Feed") : "Direct Link & Drafts")}
          </div>
          <p className="text-[11px] text-app-muted font-mono truncate">
            {workflow.feedUrl || "Ad-hoc content"}
          </p>
        </div>

        {/* Step 2: Assigned Templates */}
        <div className="rounded-lg border border-app-border bg-app-surface p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-app-muted font-semibold">
              2. Assigned Visuals
            </span>
            <span className="text-[9px] font-mono text-app-muted">
              {isYoutube ? "Vertical 9:16" : "Card & Carousel"}
            </span>
          </div>

          {isYoutube ? (
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-7 rounded border border-red-200 bg-red-50 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <span className="text-[10px]">🎬</span>
              </div>
              <div className="space-y-0.5 truncate">
                <div className="text-xs font-medium text-app-ink truncate">
                  {videoReelTemplate ? videoReelTemplate.name : "Default Podcast Reel (9:16)"}
                </div>
                <div className="text-[10px] text-app-muted font-mono truncate">
                  {workflow.targetClipsCount || 3} clips · {workflow.targetDuration || "30-60"}s duration
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                className="h-10 w-10 rounded border border-black/10 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden"
                style={{ backgroundColor: swatchBg }}
              >
                <div
                  className={`text-[8px] font-mono uppercase ${
                    isDark ? "text-white" : "text-black"
                  }`}
                >
                  Card
                </div>
              </div>
              <div className="space-y-0.5 truncate">
                <div className="text-xs font-medium text-app-ink truncate">
                  {cardTemplate ? cardTemplate.name : "Default Editorial Card"}
                </div>
                <div className="text-[10px] text-app-muted font-mono truncate">
                  {carouselTemplate ? carouselTemplate.name : "Default Editorial Deck"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Target Formats */}
        <div className="rounded-lg border border-app-border bg-app-surface p-3.5 space-y-1.5 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-app-muted font-semibold block">
            3. Output Pipeline
          </span>
          <div className="flex flex-wrap gap-1.5">
            {workflow.enabledFormats.map((fmt) => (
              <span
                key={fmt}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-app-border bg-app-subtle text-app-ink font-medium"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-app-surface">
        <div className="flex items-center gap-2">
          {workflow.feedUrl && (
            <button
              type="button"
              onClick={() => setStreamOpen(!streamOpen)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors shadow-xs ${
                streamOpen
                  ? "border-app-ink bg-app-subtle text-app-ink font-semibold"
                  : "border-app-border bg-app-surface text-app-muted hover:text-app-ink"
              }`}
            >
              {streamOpen ? "Hide Stream" : "Browse Stream"}
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(workflow)}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-app-border bg-app-surface text-app-muted hover:text-app-ink shadow-xs transition-colors"
          >
            Edit Workflow
          </button>
        </div>

        {workflow.feedUrl && (
          <button
            type="button"
            onClick={() => onPollNow(workflow)}
            disabled={isPolling}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-app-border bg-app-surface text-app-ink hover:bg-app-subtle shadow-xs transition-colors disabled:opacity-50"
          >
            {isPolling ? "Polling..." : "Poll Feed Now ↻"}
          </button>
        )}
      </div>

      {/* Expandable Feed Stream Drawer */}
      {streamOpen && workflow.feedUrl && (
        <FeedStreamDrawer workflow={workflow} />
      )}
    </div>
  );
}
