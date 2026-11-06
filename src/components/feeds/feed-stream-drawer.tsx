"use client";

/**
 * Feed Stream Drawer Component
 * Expandable drawer displaying live publication RSS articles with 1-click repurposing through its workflow.
 * System Layer: ui / feeds
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { WorkflowRecord } from "@/db/queries-brand-kit";

interface FeedStreamDrawerProps {
  workflow: WorkflowRecord;
  onRepurposed?: (articleId: string) => void;
}

interface StreamItem {
  title: string;
  link: string;
  publishedAt?: string;
  summary?: string;
  isIngested: boolean;
  articleId?: string;
}

export function FeedStreamDrawer({
  workflow,
  onRepurposed,
}: FeedStreamDrawerProps): React.JSX.Element {
  const [items, setItems] = useState<StreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [repurposingUrls, setRepurposingUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;
    const fetchStream = async () => {
      if (!workflow.feedId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/feeds/items?feedId=${workflow.feedId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load feed stream.");

        if (mounted) {
          setItems(data.items || []);
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load live feed.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStream();
    return () => {
      mounted = false;
    };
  }, [workflow.feedId]);

  const handleRepurpose = async (item: StreamItem) => {
    setRepurposingUrls((prev) => new Set(prev).add(item.link));

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: item.link,
          workflowConfig: {
            enabledFormats: workflow.enabledFormats,
            cardTemplateId: workflow.cardTemplateId,
            carouselTemplateId: workflow.carouselTemplateId,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Repurposing failed.");

      setItems((prev) =>
        prev.map((i) =>
          i.link === item.link ? { ...i, isIngested: true, articleId: data.articleId } : i
        )
      );

      if (onRepurposed) onRepurposed(data.articleId);
    } catch (err: any) {
      alert(`Could not repurpose article: ${err.message}`);
    } finally {
      setRepurposingUrls((prev) => {
        const next = new Set(prev);
        next.delete(item.link);
        return next;
      });
    }
  };

  return (
    <div className="border-t border-app-border bg-app-subtle/30 p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between border-b border-app-border/40 pb-2">
        <span className="text-xs font-mono uppercase font-semibold text-app-muted">
          Live Publication Stream ({items.length} items)
        </span>
        <span className="text-[11px] text-app-muted font-mono truncate max-w-sm">
          {workflow.feedUrl}
        </span>
      </div>

      {loading ? (
        <div className="py-6 text-center text-xs font-mono text-app-muted animate-pulse">
          Fetching live publication articles...
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-rose-600 font-mono">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="py-4 text-center text-xs text-app-muted">
          No articles detected in this feed stream.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {items.map((item, idx) => {
            const isRepurposing = repurposingUrls.has(item.link);
            return (
              <div
                key={idx}
                className="rounded-md border border-app-border bg-app-surface p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-0.5">
                  <h4 className="font-serif font-bold text-xs text-app-ink line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-app-muted font-mono">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recent Story"}
                  </p>
                </div>

                <div>
                  {item.isIngested ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        In Inbox
                      </span>
                      <Link
                        href="/inbox"
                        className="text-xs text-app-muted hover:text-app-ink underline transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRepurpose(item)}
                      disabled={isRepurposing}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md bg-app-ink text-white hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isRepurposing ? "Repurposing..." : "Repurpose →"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

