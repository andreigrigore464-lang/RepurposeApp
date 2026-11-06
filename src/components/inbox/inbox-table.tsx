"use client";

/**
 * Editorial Drafts Inbox Table
 * Lists ingested articles and video reels with pipeline extraction progress and direct review links.
 * System Layer: ui / inbox
 */

import React, { useState, useEffect } from "react";
import { InboxArticleItem } from "@/db/queries-inbox";
import { InboxTableRow } from "./inbox-table-row";

interface InboxTableProps {
  articles: InboxArticleItem[];
}

export function InboxTable({ articles: initialArticles }: InboxTableProps): React.JSX.Element {
  const [articles, setArticles] = useState<InboxArticleItem[]>(initialArticles);
  const [filter, setFilter] = useState<"all" | "ready" | "processing">("all");
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingArticleId, setDeletingArticleId] = useState<string | null>(null);
  const [deletingFormatId, setDeletingFormatId] = useState<string | null>(null);
  const [retryingArticleId, setRetryingArticleId] = useState<string | null>(null);
  const [pollingFeeds, setPollingFeeds] = useState(false);
  const [pollMessage, setPollMessage] = useState<string | null>(null);

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  // Automatically poll for updates while any article/video has pending jobs or no formats
  useEffect(() => {
    const hasPending = articles.some(
      (a) =>
        a.formats.length === 0 ||
        (a.videoJob && a.videoJob.status !== "completed" && a.videoJob.status !== "failed")
    );
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.articles)) {
            setArticles(data.articles);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [articles]);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.canonicalUrl.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "ready") return article.formats.length > 0;
    if (filter === "processing") return article.formats.length === 0;
    return true;
  });

  const handleDeleteArticle = async (articleId: string) => {
    setDeletingArticleId(articleId);
    try {
      const res = await fetch(`/api/articles?id=${articleId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete article");
      }

      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      setConfirmDeleteId(null);
    } catch (err: any) {
      alert(`Could not delete item: ${err.message}`);
    } finally {
      setDeletingArticleId(null);
    }
  };

  const handleDeleteFormat = async (articleId: string, formatId: string, formatKind: string) => {
    if (!confirm(`Remove this ${formatKind} draft?`)) return;
    setDeletingFormatId(formatId);
    try {
      const res = await fetch(`/api/format-outputs?id=${formatId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete format draft");
      }

      setArticles((prev) =>
        prev.map((a) => {
          if (a.id !== articleId) return a;
          return {
            ...a,
            formats: a.formats.filter((f) => f.id !== formatId),
          };
        })
      );
    } catch (err: any) {
      alert(`Could not delete format draft: ${err.message}`);
    } finally {
      setDeletingFormatId(null);
    }
  };

  const handleRetryPipeline = async (articleId: string) => {
    setRetryingArticleId(articleId);
    try {
      const res = await fetch("/api/articles/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate formats.");
      }

      const data = await res.json();
      if (data.article) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? data.article : a))
        );
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      alert(`Format generation error: ${err.message}`);
    } finally {
      setRetryingArticleId(null);
    }
  };

  const handleManualPoll = async () => {
    setPollingFeeds(true);
    setPollMessage(null);
    try {
      const res = await fetch("/api/feeds/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to poll feeds.");

      setPollMessage(data.message || `Polled all feeds: ${data.totalNewArticles || 0} new items found.`);

      const artRes = await fetch("/api/articles");
      if (artRes.ok) {
        const artData = await artRes.json();
        if (Array.isArray(artData.articles)) {
          setArticles(artData.articles);
        }
      }
    } catch (err: any) {
      setPollMessage(`Poll error: ${err.message}`);
    } finally {
      setPollingFeeds(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter Tabs & Poll Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex border border-app-border rounded-lg p-0.5 bg-app-subtle/50 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === "all"
                  ? "bg-app-surface text-app-ink shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              All ({articles.length})
            </button>
            <button
              onClick={() => setFilter("ready")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === "ready"
                  ? "bg-app-surface text-app-ink shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Ready for Review ({articles.filter((a) => a.formats.length > 0).length})
            </button>
            <button
              onClick={() => setFilter("processing")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === "processing"
                  ? "bg-app-surface text-app-ink shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Pending / In Progress ({articles.filter((a) => a.formats.length === 0).length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by title or URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-xs text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent shadow-xs w-full sm:w-64"
          />

          <button
            onClick={handleManualPoll}
            disabled={pollingFeeds}
            className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap"
          >
            <span>{pollingFeeds ? "Polling..." : "Poll Feeds Now ↻"}</span>
          </button>
        </div>
      </div>

      {pollMessage && (
        <div className="p-3 rounded-lg border border-app-border bg-app-subtle text-xs text-app-ink flex items-center justify-between">
          <span>{pollMessage}</span>
          <button
            onClick={() => setPollMessage(null)}
            className="text-app-muted hover:text-app-ink text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-xl border border-app-border bg-app-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-app-ink">
            <thead className="border-b border-app-border bg-app-subtle/50 text-app-muted font-mono uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3.5 font-medium">Source / Title</th>
                <th className="px-6 py-3.5 font-medium">Grounding / Status</th>
                <th className="px-6 py-3.5 font-medium">Generated Formats</th>
                <th className="px-6 py-3.5 font-medium">Date</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-app-muted text-sm">
                    {search ? "No items match your search." : "No ingested items yet."}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <InboxTableRow
                    key={article.id}
                    article={article}
                    confirmDeleteId={confirmDeleteId}
                    deletingArticleId={deletingArticleId}
                    deletingFormatId={deletingFormatId}
                    retryingArticleId={retryingArticleId}
                    onSetConfirmDeleteId={setConfirmDeleteId}
                    onDeleteArticle={handleDeleteArticle}
                    onDeleteFormat={handleDeleteFormat}
                    onRetry={handleRetryPipeline}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
