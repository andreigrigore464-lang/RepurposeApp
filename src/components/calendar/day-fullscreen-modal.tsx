"use client";

/**
 * Day Fullscreen Detail Modal
 * Fullscreen deep-dive view into all scheduled and published posts for a specific date.
 * System Layer: ui / calendar
 */

import React, { useState } from "react";
import Link from "next/link";
import { ScheduledOutputItem } from "@/db/queries-calendar";
import { PublishPostModal } from "./publish-post-modal";

interface DayFullscreenModalProps {
  dateStr: string; // YYYY-MM-DD
  items: ScheduledOutputItem[];
  hasVotedTrust: boolean;
  onClose: () => void;
  onItemPublished: (id: string) => void;
  onItemUnscheduled: (id: string) => void;
  onVotedSuccess: () => void;
}

export function DayFullscreenModal({
  dateStr,
  items,
  hasVotedTrust,
  onClose,
  onItemPublished,
  onItemUnscheduled,
  onVotedSuccess,
}: DayFullscreenModalProps): React.JSX.Element {
  const [publishingItem, setPublishingItem] = useState<ScheduledOutputItem | null>(null);
  const [isUnschedulingId, setIsUnschedulingId] = useState<string | null>(null);

  // Formatted date string (e.g. "Thursday, November 6, 2026")
  const dateObj = new Date(dateStr + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleUnschedule = async (item: ScheduledOutputItem) => {
    if (!confirm(`Are you sure you want to remove this ${item.format_kind} from the schedule?`)) {
      return;
    }
    setIsUnschedulingId(item.id);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "unschedule",
          formatOutputId: item.id,
        }),
      });
      if (res.ok) {
        onItemUnscheduled(item.id);
      }
    } catch (err) {
      console.error("Failed to unschedule:", err);
    } finally {
      setIsUnschedulingId(null);
    }
  };

  const scheduledCount = items.filter((i) => i.status === "scheduled").length;
  const publishedCount = items.filter((i) => i.status === "published").length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app-bg overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-app-border bg-app-surface px-8 py-5 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs text-app-muted hover:text-app-ink transition-colors font-medium mr-2"
            >
              <span>← Back to Calendar</span>
            </button>
            <h1 className="text-xl font-serif font-bold text-app-ink">
              {formattedDate}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs text-app-muted mt-1">
            <span>
              <strong>{items.length}</strong> total post(s)
            </span>
            <span>•</span>
            <span className="text-amber-700 font-medium">
              {scheduledCount} scheduled
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">
              {publishedCount} published
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="rounded-md border border-app-border bg-app-surface px-4 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            + Schedule from Inbox
          </Link>
          <button
            onClick={onClose}
            className="rounded-md bg-app-ink px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full space-y-6">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-app-border bg-app-surface/50 p-16 text-center space-y-3">
            <span className="text-3xl">🗓️</span>
            <h3 className="text-sm font-semibold text-app-ink">
              No posts scheduled for this day
            </h3>
            <p className="text-xs text-app-muted max-w-md mx-auto">
              Open your Drafts Inbox, review an article draft, and click "Schedule" to queue posts for this date.
            </p>
            <div className="pt-2">
              <Link
                href="/inbox"
                className="inline-block rounded-md bg-app-ink px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs"
              >
                Go to Drafts Inbox →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((item) => {
              const scheduledAt = item.slots_data?.scheduled_at;
              const hasTime = item.slots_data?.scheduled_has_time;
              const timeDisplay =
                hasTime && scheduledAt && scheduledAt.includes("T")
                  ? scheduledAt.split("T")[1]?.slice(0, 5)
                  : null;

              const isPublished = item.status === "published";
              const primaryVariant = item.variants?.[0];
              const variantPayload = (primaryVariant?.adapted_payload || {}) as Record<string, any>;
              const snippetText =
                typeof variantPayload.text === "string"
                  ? variantPayload.text
                  : Array.isArray(variantPayload.posts)
                  ? variantPayload.posts[0]
                  : "Post content ready";

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isPublished
                      ? "border-emerald-200 bg-emerald-50/20"
                      : "border-app-border bg-app-surface hover:shadow-md"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Row: Format & Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase font-bold px-2 py-0.5 rounded bg-app-subtle text-app-ink">
                          {item.format_kind.replace("-", " ")}
                        </span>
                        {timeDisplay && (
                          <span className="font-mono text-[11px] text-app-muted bg-app-subtle px-2 py-0.5 rounded font-medium">
                            🕒 {timeDisplay}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isPublished
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Article Title */}
                    <div>
                      <h3 className="text-sm font-serif font-bold text-app-ink line-clamp-1">
                        {item.article?.title || "Repurposed Article"}
                      </h3>
                      {item.article?.canonical_url && (
                        <a
                          href={item.article.canonical_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-app-muted hover:underline line-clamp-1 mt-0.5"
                        >
                          {item.article.canonical_url}
                        </a>
                      )}
                    </div>

                    {/* Content Snippet */}
                    <div className="rounded-lg border border-app-border bg-app-subtle/30 p-3 text-xs text-app-ink line-clamp-4 leading-relaxed font-sans">
                      {snippetText}
                    </div>

                    {/* Available Platforms */}
                    {item.variants && item.variants.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-app-muted uppercase font-semibold">
                          Platforms:
                        </span>
                        {item.variants.map((v) => (
                          <span
                            key={v.platform_id}
                            className="rounded bg-app-surface border border-app-border px-2 py-0.5 text-[10px] font-mono text-app-ink capitalize"
                          >
                            {v.platform_id}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-5 mt-4 border-t border-app-border">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/review/${item.id}`}
                        className="text-xs text-app-muted hover:text-app-ink transition-colors font-medium"
                      >
                        Edit in Review ↗
                      </Link>
                      <span>•</span>
                      <button
                        onClick={() => handleUnschedule(item)}
                        disabled={isUnschedulingId === item.id}
                        className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {isUnschedulingId === item.id ? "Removing..." : "Unschedule"}
                      </button>
                    </div>

                    <button
                      onClick={() => setPublishingItem(item)}
                      className={`rounded-md px-4 py-2 text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
                        isPublished
                          ? "bg-app-subtle border border-app-border text-app-ink hover:bg-app-surface"
                          : "bg-app-ink text-white hover:bg-zinc-800"
                      }`}
                    >
                      <span>{isPublished ? "View / Repost" : "Ready to Post →"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Publish Post Modal */}
      {publishingItem && (
        <PublishPostModal
          item={publishingItem}
          hasVotedTrust={hasVotedTrust}
          onClose={() => setPublishingItem(null)}
          onPublishedSuccess={(id) => {
            onItemPublished(id);
            // Update local state in item
            publishingItem.status = "published";
          }}
          onVotedSuccess={onVotedSuccess}
        />
      )}
    </div>
  );
}

