"use client";

/**
 * Repurpose Studio Component
 * Clean top-level coordinator for ad-hoc written article and long-form video repurposing.
 * System Layer: ui / repurpose
 */

import React, { useState } from "react";
import { WorkflowRecord, UserTemplateRecord, BrandKitRecord } from "@/db/queries-brand-kit";
import { ArticleRepurposePanel } from "@/components/repurpose/article-repurpose-panel";
import { VideoRepurposePanel } from "@/components/repurpose/video-repurpose-panel";

interface RepurposeStudioProps {
  workflows: WorkflowRecord[];
  templates: UserTemplateRecord[];
  brandKit: BrandKitRecord | null;
}

export function RepurposeStudio({
  workflows,
  templates,
}: RepurposeStudioProps): React.JSX.Element {
  const [mediaMode, setMediaMode] = useState<"article" | "video">("video");

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-app-ink tracking-tight">
          Repurpose Studio
        </h1>
        <p className="text-sm text-app-muted mt-1">
          Transform any single article, video file, or YouTube link into grounded social formats and vertical promo reels.
        </p>
      </div>

      {/* Main Mode Toggle: Video Reels vs Written Articles */}
      <div className="flex border border-app-border rounded-xl p-1 bg-app-subtle/40 shadow-xs max-w-md">
        <button
          type="button"
          onClick={() => setMediaMode("video")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            mediaMode === "video"
              ? "bg-app-surface text-app-ink shadow-xs font-bold"
              : "text-app-muted hover:text-app-ink"
          }`}
        >
          <span>🎬</span>
          <span>Video Reels (YouTube / MP4)</span>
        </button>

        <button
          type="button"
          onClick={() => setMediaMode("article")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            mediaMode === "article"
              ? "bg-app-surface text-app-ink shadow-xs font-bold"
              : "text-app-muted hover:text-app-ink"
          }`}
        >
          <span>📰</span>
          <span>Article / Written Text</span>
        </button>
      </div>

      {/* Render Panel by Mode */}
      {mediaMode === "video" ? (
        <VideoRepurposePanel templates={templates} />
      ) : (
        <ArticleRepurposePanel workflows={workflows} />
      )}
    </div>
  );
}
