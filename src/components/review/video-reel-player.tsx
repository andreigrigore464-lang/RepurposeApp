"use client";

/**
 * Video Reel Player Component
 * Renders an HTML5 9:16 vertical video preview for short promo reels with download actions,
 * subtitle export, and channel taste feedback poll for continuous AI learning.
 * System Layer: ui / review
 */

import React, { useState, useEffect } from "react";
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
  const [vote, setVote] = useState<"yes" | "no" | null>(null);
  const [comment, setComment] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [savedConfirmation, setSavedConfirmation] = useState(false);

  // Check if feedback was previously recorded for this reel
  useEffect(() => {
    fetch("/api/brand/reel-feedback")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.feedback)) {
          const match = data.feedback.find(
            (fb: any) => fb.format_output_id === formatOutput.id
          );
          if (match) {
            setVote(match.rating);
            if (match.comment) setComment(match.comment);
          }
        }
      })
      .catch(() => {});
  }, [formatOutput.id]);

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

  const submitFeedback = async (selectedVote: "yes" | "no", userComment?: string) => {
    setSavingFeedback(true);
    setSavedConfirmation(false);
    try {
      const res = await fetch("/api/brand/reel-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formatOutputId: formatOutput.id,
          rating: selectedVote,
          comment: userComment ?? comment,
          hookText: hookText || article.title,
        }),
      });
      if (res.ok) {
        setSavedConfirmation(true);
        setTimeout(() => setSavedConfirmation(false), 4000);
      }
    } catch (err) {
      console.error("Failed to save reel feedback:", err);
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleVote = (newVote: "yes" | "no") => {
    setVote(newVote);
    submitFeedback(newVote, comment);
  };

  const handleSaveComment = () => {
    if (!vote) return;
    submitFeedback(vote, comment);
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

      {/* Channel Taste & Quality Feedback Poll */}
      <div className="bg-app-subtle/30 border border-app-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-app-ink flex items-center gap-1.5">
              <span>🧠</span>
              <span>Hook & Framing Feedback</span>
            </h4>
            <p className="text-[11px] text-app-muted">
              Did this clip capture a great moment? Your rating teaches future AI selections.
            </p>
          </div>

          {/* Simple Yes/No Poll Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleVote("yes")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                vote === "yes"
                  ? "bg-emerald-600 text-white font-semibold shadow-xs"
                  : "border border-app-border bg-app-surface text-app-ink hover:bg-emerald-50 hover:border-emerald-300"
              }`}
            >
              <span>👍</span>
              <span>Good Clip</span>
            </button>

            <button
              type="button"
              onClick={() => handleVote("no")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
                vote === "no"
                  ? "bg-rose-600 text-white font-semibold shadow-xs"
                  : "border border-app-border bg-app-surface text-app-ink hover:bg-rose-50 hover:border-rose-300"
              }`}
            >
              <span>👎</span>
              <span>Needs Work</span>
            </button>
          </div>
        </div>

        {/* Optional feedback note */}
        {vote && (
          <div className="pt-2 border-t border-app-border/60 flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                vote === "yes"
                  ? "Optional note: What worked? (e.g. hilarious punchline, gripping hook)"
                  : "Optional note: What failed? (e.g. cut off too early, hook was too dry, bad face crop)"
              }
              className="flex-1 w-full text-xs px-3 py-1.5 rounded border border-app-border bg-app-surface text-app-ink placeholder:text-app-muted focus:outline-none focus:border-app-ink"
            />
            <button
              type="button"
              disabled={savingFeedback}
              onClick={handleSaveComment}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded bg-app-ink text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-2xs whitespace-nowrap"
            >
              {savingFeedback ? "Saving..." : savedConfirmation ? "✓ Saved" : "Save Note"}
            </button>
          </div>
        )}

        {savedConfirmation && (
          <p className="text-[11px] font-mono text-emerald-600 flex items-center gap-1 pt-0.5">
            <span>✓</span>
            <span>Saved to channel taste memory. Gemini will adapt to this feedback on future jobs.</span>
          </p>
        )}
      </div>
    </div>
  );
}
