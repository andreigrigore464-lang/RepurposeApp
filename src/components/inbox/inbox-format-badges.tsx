"use client";

/**
 * Inbox Format Badges Component
 * Renders individual social format badges (text, thread, card, carousel) and video reels (Reel #1, Reel #2).
 * System Layer: ui / inbox
 */

import React from "react";
import Link from "next/link";
import { InboxFormatBadge, VideoJobProgressInfo } from "@/db/queries-inbox";

interface InboxFormatBadgesProps {
  articleId: string;
  formats: InboxFormatBadge[];
  videoJob?: VideoJobProgressInfo | null;
  status: string;
  isRetrying: boolean;
  deletingFormatId: string | null;
  onRetry: () => void;
  onDeleteFormat: (formatId: string, formatKind: string) => void;
}

export function getFormatBadgeStyle(formatKind: string): string {
  switch (formatKind) {
    case "text-post":
      return "border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100";
    case "thread":
      return "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100";
    case "card":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    case "carousel":
      return "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100";
    case "video-reel":
      return "border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 font-semibold";
    default:
      return "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100";
  }
}

export function InboxFormatBadges({
  articleId,
  formats,
  videoJob,
  status,
  isRetrying,
  deletingFormatId,
  onRetry,
  onDeleteFormat,
}: InboxFormatBadgesProps): React.JSX.Element {
  // 1. Retry state
  if (isRetrying) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-app-accent font-medium animate-pulse">
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Regenerating formats...</span>
      </span>
    );
  }

  // 2. Active video worker progress state
  if (videoJob && videoJob.status !== "completed" && videoJob.status !== "failed") {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50/70 px-3 py-1.5 text-xs text-purple-900 shadow-2xs">
        <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
        <span className="font-semibold capitalize">{videoJob.status}:</span>
        <span className="text-[11px] text-purple-800 truncate max-w-xs">
          {videoJob.stageMessage || "Cutting video reels..."}
        </span>
        <span className="font-mono font-bold text-[10px] bg-purple-200 text-purple-950 px-1.5 py-0.2 rounded">
          {videoJob.progressPct}%
        </span>
      </div>
    );
  }

  // 3. Pending or failed state with zero formats
  if (formats.length === 0) {
    if (status.includes("failed") || status === "drafted") {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-rose-600 font-medium">Generation failed</span>
          <button
            type="button"
            onClick={onRetry}
            className="px-2.5 py-1 text-[11px] font-semibold text-app-ink bg-app-surface border border-app-border rounded-md shadow-xs hover:bg-app-subtle transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] text-app-accent font-medium animate-pulse">
        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <span>Generating formats...</span>
      </span>
    );
  }

  // 4. Formats list display
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex flex-wrap gap-1.5">
        {formats.map((fmt, idx) => {
          const isVideo = fmt.formatKind === "video-reel";
          const label = isVideo
            ? `Reel #${fmt.reelIndex || idx + 1}${
                fmt.durationSeconds ? ` (${fmt.durationSeconds}s)` : " (9:16)"
              }`
            : fmt.formatKind;

          return (
            <div
              key={fmt.id}
              className={`inline-flex items-center rounded-md border text-[11px] transition-colors ${getFormatBadgeStyle(
                fmt.formatKind
              )}`}
            >
              <Link
                href={`/review/${fmt.id}`}
                className="px-2.5 py-1 flex items-center hover:opacity-80"
              >
                <span>{label}</span>
                <span className="ml-1 opacity-60 text-[9px] uppercase font-mono">
                  Review →
                </span>
              </Link>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteFormat(fmt.id, fmt.formatKind);
                }}
                disabled={deletingFormatId === fmt.id}
                title={`Delete ${fmt.formatKind}`}
                aria-label={`Delete ${fmt.formatKind}`}
                className="pr-2 pl-0.5 py-1 text-app-muted hover:text-red-600 transition-colors opacity-50 hover:opacity-100"
              >
                {deletingFormatId === fmt.id ? (
                  <span className="text-[9px]">...</span>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onRetry}
        title="Regenerate all formats for this article"
        className="inline-flex items-center gap-1 rounded border border-app-border/80 bg-app-surface px-2 py-1 text-[10px] font-mono text-app-muted hover:text-app-ink hover:bg-app-subtle transition-colors shadow-2xs"
      >
        <span>↻</span>
        <span>Regenerate</span>
      </button>
    </div>
  );
}

