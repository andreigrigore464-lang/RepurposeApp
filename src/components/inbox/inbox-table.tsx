"use client";

/**
 * Editorial Drafts Inbox Table
 * Lists ingested articles with pipeline extraction progress and direct review links.
 * System Layer: ui / inbox
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { InboxArticleItem } from "@/db/queries-inbox";

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

  // Automatically poll for updates while any article has no formats generated yet
  useEffect(() => {
    const hasPending = articles.some((a) => a.formats.length === 0);
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
      alert(`Could not delete article: ${err.message}`);
    } finally {
      setDeletingArticleId(null);
    }
  };

  const handleDeleteFormat = async (articleId: string, formatId: string) => {
    setDeletingFormatId(formatId);
    try {
      const res = await fetch(`/api/format-outputs?id=${formatId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete format post");
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
      alert(`Could not delete post format: ${err.message}`);
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

      setPollMessage(data.message || "Feeds polled successfully.");

      // Refresh articles list
      const artRes = await fetch("/api/articles");
      if (artRes.ok) {
        const artData = await artRes.json();
        if (Array.isArray(artData.articles)) {
          setArticles(artData.articles);
        }
      }
    } catch (err: any) {
      alert(`Feed poll error: ${err.message}`);
    } finally {
      setPollingFeeds(false);
    }
  };

  const getFormatBadgeStyle = (formatKind: string) => {
    switch (formatKind) {
      case "text-post":
        return "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100";
      case "thread":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100";
      case "card":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "carousel":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200";
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 border border-app-border rounded-lg bg-app-surface p-1 shadow-sm">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-app-subtle text-app-ink font-semibold"
                : "text-app-muted hover:text-app-ink"
            }`}
          >
            All Articles ({articles.length})
          </button>
          <button
            onClick={() => setFilter("ready")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === "ready"
                ? "bg-app-subtle text-app-ink font-semibold"
                : "text-app-muted hover:text-app-ink"
            }`}
          >
            Ready for Review ({articles.filter((a) => a.formats.length > 0).length})
          </button>
          <button
            onClick={() => setFilter("processing")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              filter === "processing"
                ? "bg-app-subtle text-app-ink font-semibold"
                : "text-app-muted hover:text-app-ink"
            }`}
          >
            Processing ({articles.filter((a) => a.formats.length === 0).length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleManualPoll}
            disabled={pollingFeeds}
            title="Poll all configured RSS feeds for new articles immediately"
            className="inline-flex items-center gap-1.5 rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-2xs disabled:opacity-50 whitespace-nowrap"
          >
            {pollingFeeds ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-app-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Polling feeds...</span>
              </>
            ) : (
              <>
                <span className="font-mono">↻</span>
                <span>Poll Feeds</span>
              </>
            )}
          </button>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search articles by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Poll Feedback Notification */}
      {pollMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-xs font-medium text-emerald-800 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{pollMessage}</span>
          </div>
          <button
            onClick={() => setPollMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 opacity-60 hover:opacity-100 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-app-subtle/50 text-[11px] font-semibold text-app-muted uppercase tracking-wider border-b border-app-border">
            <tr>
              <th className="px-6 py-3">Article Title & Source</th>
              <th className="px-6 py-3">Grounding</th>
              <th className="px-6 py-3">Available Formats</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border">
            {filteredArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-app-muted">
                  <p className="font-medium text-app-ink">No articles found in this view.</p>
                  <p className="text-[11px] mt-1">
                    Ingest an article on the <Link href="/feeds" className="text-app-accent hover:underline">Feeds page</Link> to generate grounded drafts.
                  </p>
                </td>
              </tr>
            ) : (
              filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-app-subtle/30 transition-colors">
                  <td className="px-6 py-4 max-w-md">
                    <div className="font-serif font-bold text-sm text-app-ink line-clamp-1">
                      {article.title}
                    </div>
                    <a
                      href={article.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-app-muted hover:text-app-accent truncate block mt-0.5"
                    >
                      {article.canonicalUrl}
                    </a>
                  </td>

                  <td className="px-6 py-4">
                    {article.digestItemsCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {article.digestItemsCount} grounded items
                      </span>
                    ) : article.status.includes("failed") ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-medium text-rose-700">
                        Extraction failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                        Extracting digest...
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    {retryingArticleId === article.id ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-app-accent font-medium animate-pulse">
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Regenerating formats...</span>
                      </span>
                    ) : article.formats.length === 0 ? (
                      article.status.includes("failed") || article.status === "drafted" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-rose-600 font-medium">Generation failed</span>
                          <button
                            type="button"
                            onClick={() => handleRetryPipeline(article.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-app-ink bg-app-surface border border-app-border rounded-md shadow-xs hover:bg-app-subtle transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-app-accent font-medium animate-pulse">
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>Generating formats...</span>
                        </span>
                      )
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex flex-wrap gap-1.5">
                          {article.formats.map((fmt) => (
                            <div
                              key={fmt.id}
                              className={`inline-flex items-center rounded-md border text-[11px] font-medium transition-colors ${getFormatBadgeStyle(
                                fmt.formatKind
                              )}`}
                            >
                              <Link
                                href={`/review/${fmt.id}`}
                                className="px-2.5 py-1 flex items-center hover:opacity-80"
                              >
                                <span>{fmt.formatKind}</span>
                                <span className="ml-1 opacity-60 text-[9px] uppercase font-mono">
                                  Review →
                                </span>
                              </Link>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (confirm(`Remove this ${fmt.formatKind} draft?`)) {
                                    handleDeleteFormat(article.id, fmt.id);
                                  }
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
                          ))}
                        </div>

                        {/* Regenerate formats button - only appears when formats already exist */}
                        <button
                          type="button"
                          onClick={() => handleRetryPipeline(article.id)}
                          disabled={retryingArticleId === article.id}
                          title="Regenerate all formats for this article"
                          className="inline-flex items-center gap-1 rounded border border-app-border/80 bg-app-surface px-2 py-1 text-[10px] font-mono text-app-muted hover:text-app-ink hover:bg-app-subtle transition-colors shadow-2xs"
                        >
                          <span>↻</span>
                          <span>Regenerate</span>
                        </button>
                      </div>
                    )}
                  </td>

                  <td 
                    suppressHydrationWarning 
                    className="px-6 py-4 text-[11px] font-mono text-app-muted whitespace-nowrap"
                  >
                    {new Date(article.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {confirmDeleteId === article.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <span className="text-[11px] text-red-600 font-medium">Delete article?</span>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          disabled={deletingArticleId === article.id}
                          className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {deletingArticleId === article.id ? "Deleting..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingArticleId === article.id}
                          className="rounded border border-app-border bg-app-surface px-2 py-1 text-[11px] text-app-muted hover:text-app-ink transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(article.id)}
                        title="Delete article & all generated formats"
                        aria-label="Delete article"
                        className="inline-flex items-center gap-1 p-1.5 text-app-muted hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
