"use client";

/**
 * Inbox Table Row Component
 * Renders a single row in the editorial drafts inbox table with source badges and action buttons.
 * System Layer: ui / inbox
 */

import React from "react";
import { InboxArticleItem } from "@/db/queries-inbox";
import { InboxFormatBadges } from "./inbox-format-badges";

interface InboxTableRowProps {
  article: InboxArticleItem;
  confirmDeleteId: string | null;
  deletingArticleId: string | null;
  deletingFormatId: string | null;
  retryingArticleId: string | null;
  onSetConfirmDeleteId: (id: string | null) => void;
  onDeleteArticle: (id: string) => void;
  onDeleteFormat: (articleId: string, formatId: string, formatKind: string) => void;
  onRetry: (id: string) => void;
}

export function InboxTableRow({
  article,
  confirmDeleteId,
  deletingArticleId,
  deletingFormatId,
  retryingArticleId,
  onSetConfirmDeleteId,
  onDeleteArticle,
  onDeleteFormat,
  onRetry,
}: InboxTableRowProps): React.JSX.Element {
  const isVideo = article.sourceType === "youtube" || article.sourceType === "video_upload";
  const thumbnailUrl = (article.mediaMetadata as any)?.thumbnailUrl || (article.mediaMetadata as any)?.thumbnail_url;

  return (
    <tr className="hover:bg-app-subtle/30 transition-colors">
      {/* Article / Video Title & Link */}
      <td className="px-6 py-4 max-w-md">
        <div className="flex items-start gap-3">
          {thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt="Thumbnail"
              className="h-10 w-16 object-cover rounded border border-app-border flex-shrink-0 shadow-2xs mt-0.5"
            />
          )}
          <div className="truncate">
            <div className="flex items-center gap-1.5 mb-0.5">
              {article.sourceType === "youtube" && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-red-100 text-red-800 font-bold">
                  YouTube
                </span>
              )}
              {article.sourceType === "video_upload" && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold">
                  Video
                </span>
              )}
              <span className="font-serif font-bold text-sm text-app-ink truncate">
                {article.title}
              </span>
            </div>
            <a
              href={article.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-app-muted hover:text-app-accent truncate block"
            >
              {article.canonicalUrl}
            </a>
          </div>
        </div>
      </td>

      {/* Grounding / Extraction State */}
      <td className="px-6 py-4 whitespace-nowrap">
        {isVideo ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-800">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            Audio Transcript & Hooks
          </span>
        ) : article.digestItemsCount > 0 ? (
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

      {/* Formats Badges */}
      <td className="px-6 py-4">
        <InboxFormatBadges
          articleId={article.id}
          formats={article.formats}
          videoJob={article.videoJob}
          status={article.status}
          isRetrying={retryingArticleId === article.id}
          deletingFormatId={deletingFormatId}
          onRetry={() => onRetry(article.id)}
          onDeleteFormat={(fmtId, fmtKind) => onDeleteFormat(article.id, fmtId, fmtKind)}
        />
      </td>

      {/* Ingest Date */}
      <td
        suppressHydrationWarning
        className="px-6 py-4 text-[11px] font-mono text-app-muted whitespace-nowrap"
      >
        {new Date(article.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </td>

      {/* Actions */}
      <td className="px-6 py-4 text-right whitespace-nowrap">
        {confirmDeleteId === article.id ? (
          <div className="inline-flex items-center gap-1.5">
            <span className="text-[11px] text-red-600 font-medium">Delete item?</span>
            <button
              onClick={() => onDeleteArticle(article.id)}
              disabled={deletingArticleId === article.id}
              className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {deletingArticleId === article.id ? "Deleting..." : "Confirm"}
            </button>
            <button
              onClick={() => onSetConfirmDeleteId(null)}
              disabled={deletingArticleId === article.id}
              className="rounded border border-app-border bg-app-surface px-2 py-1 text-[11px] text-app-muted hover:text-app-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSetConfirmDeleteId(article.id)}
            disabled={deletingArticleId === article.id}
            title="Delete this item"
            className="text-app-muted hover:text-red-600 text-xs p-1 rounded transition-colors opacity-60 hover:opacity-100"
          >
            Delete
          </button>
        )}
      </td>
    </tr>
  );
}

