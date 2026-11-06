"use client";

/**
 * Video Progress Card
 * Live progress tracker and result display for asynchronous video render jobs.
 * System Layer: ui / repurpose
 */

import React from "react";
import Link from "next/link";
import { VideoProgressState } from "@/components/repurpose/types";

interface VideoProgressCardProps {
  activeJob: VideoProgressState;
}

export function VideoProgressCard({ activeJob }: VideoProgressCardProps): React.JSX.Element {
  return (
    <div className="border-t border-app-border pt-6 space-y-4">
      {/* Header and status badge */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-app-ink flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              activeJob.status === "failed"
                ? "bg-red-500"
                : activeJob.status === "completed"
                ? "bg-emerald-500"
                : "bg-emerald-500 animate-pulse"
            }`}
          />
          <span>Worker Job Status: {activeJob.status}</span>
        </h4>
        <span className="text-xs font-mono font-bold text-app-accent">
          {activeJob.progressPct}%
        </span>
      </div>

      {/* Animated progress bar */}
      <div className="w-full bg-zinc-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            activeJob.status === "failed" ? "bg-red-500" : "bg-emerald-500"
          }`}
          style={{ width: `${Math.max(activeJob.progressPct, 5)}%` }}
        />
      </div>

      {/* Stage status message */}
      <p className="text-xs text-app-ink font-medium bg-app-subtle/40 p-3 rounded-lg border border-app-border flex items-center gap-2">
        <span className="text-app-muted font-mono uppercase text-[10px]">Stage:</span>
        <span>{activeJob.stageMessage || "Processing in background worker..."}</span>
      </p>

      {/* Error state */}
      {activeJob.errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {activeJob.errorMessage}
        </div>
      )}

      {/* Completed format outputs cards */}
      {activeJob.formats && activeJob.formats.length > 0 && (
        <div className="space-y-2 pt-2">
          <span className="text-xs font-semibold text-app-ink block">
            Generated Promo Reels:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeJob.formats.map((fmt, i) => {
              const durationSec = (fmt.slotsData as any)?.duration_seconds;
              return (
                <div
                  key={fmt.id}
                  className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between text-xs"
                >
                  <div className="font-bold text-emerald-950">
                    Reel #{i + 1}
                  </div>
                  <div className="text-[11px] text-emerald-800 font-mono mt-1">
                    {durationSec ? `${durationSec}s` : "Ready"}
                  </div>
                  <Link
                    href={`/review/${fmt.id}`}
                    className="mt-3 block text-center rounded bg-emerald-700 text-white font-semibold py-1 text-[11px] hover:bg-emerald-800 transition-colors"
                  >
                    Review & Download →
                  </Link>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/inbox"
              className="text-xs font-medium text-app-accent hover:underline block text-center"
            >
              View all drafts in Drafts Inbox →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

