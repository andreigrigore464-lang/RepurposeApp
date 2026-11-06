"use client";

/**
 * Video Reel Player Component
 * Renders an HTML5 9:16 vertical video preview for short promo reels with download actions and subtitle export.
 * System Layer: ui / review
 */

import React, { useState } from "react";
import { FormatOutputRecord } from "@/db/queries-format-outputs";
import { ArticleRecord } from "@/db/queries-articles";

interface VideoReelPlayerProps {
  formatOutput: FormatOutputRecord;
  article: ArticleRecord;
  onOpenSchedule: () => void;
}

export function VideoReelPlayer({
  formatOutput,
  article,
  onOpenSchedule,
}: VideoReelPlayerProps): React.JSX.Element {
  const slots = (formatOutput.slots_data || {}) as Record<string, any>;
  const videoUrl = slots.video_url as string | undefined;
  const durationSec = typeof slots.duration_seconds === "number" ? slots.duration_seconds : undefined;
  const hookText = (slots.hook_text as string) || (slots.hook_sentence as string);
  const startTs = slots.start_timestamp as string | undefined;
  const endTs = slots.end_timestamp as string | undefined;
  const srtContent = slots.srt_content as string | undefined;

  const [downloadingSrt, setDownloadingSrt] = useState(false);

  const handleDownloadSrt = () => {
    if (!srtContent) return;
    setDownloadingSrt(true);
    try {
      const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reel-${formatOutput.id.slice(0, 8)}.srt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloadingSrt(false), 1500);
    }
  };

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 shadow-sm space-y-6">
      {/* Reel Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-app-border pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-200">
              9:16 Vertical Reel
            </span>
            {durationSec && (
              <span className="text-[11px] font-mono text-app-muted">
                Duration: {durationSec}s
              </span>
            )}
            {startTs && endTs && (
              <span className="text-[11px] font-mono text-app-muted">
                Source Cut: {startTs} → {endTs}
              </span>
            )}
          </div>
          <h2 className="font-serif font-bold text-base text-app-ink">
            {article.title}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {videoUrl && (
            <a
              href={videoUrl}
              download={`reel-${formatOutput.id.slice(0, 8)}.mp4`}
              className="inline-flex items-center gap-1.5 rounded-md bg-app-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <span>⬇️</span>
              <span>Download MP4</span>
            </a>
          )}

          {srtContent && (
            <button
              type="button"
              onClick={handleDownloadSrt}
              className="inline-flex items-center gap-1.5 rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-2xs"
            >
              <span>📄</span>
              <span>{downloadingSrt ? "Downloaded!" : "Download .SRT"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSchedule}
            className="inline-flex items-center gap-1.5 rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-2xs"
          >
            <span>📅</span>
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* Opening Hook Provenance Callout */}
      {hookText && (
        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase font-bold text-purple-900 tracking-wider">
            Opening Hook Climax
          </span>
          <p className="text-xs text-purple-950 font-serif italic">
            &ldquo;{hookText}&rdquo;
          </p>
        </div>
      )}

      {/* 9:16 Video Player Container */}
      <div className="flex justify-center p-4 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
        {videoUrl ? (
          <div className="relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
            <video
              src={videoUrl}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="w-full max-w-[320px] aspect-[9/16] bg-zinc-900 rounded-lg flex flex-col items-center justify-center p-6 text-center space-y-3">
            <span className="text-3xl animate-bounce">🎬</span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-zinc-100">
                Video Rendering in Worker
              </p>
              <p className="text-[11px] text-zinc-400">
                The background Python worker is cutting the clip, aligning face tracking, and burning karaoke subtitles.
              </p>
            </div>
            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              Check progress in Drafts Inbox
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

