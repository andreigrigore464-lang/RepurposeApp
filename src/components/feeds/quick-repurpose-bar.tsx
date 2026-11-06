"use client";

/**
 * Quick Repurpose Bar Component
 * Omnipresent top bar for ad-hoc article and draft repurposing with workflow routing selection.
 * System Layer: ui / feeds
 */

import React, { useState } from "react";
import Link from "next/link";
import { WorkflowRecord, UserTemplateRecord } from "@/db/queries-brand-kit";

interface QuickRepurposeBarProps {
  workflows: WorkflowRecord[];
  templates: UserTemplateRecord[];
  onArticleRepurposed?: (articleId: string) => void;
}

interface ArticlePreview {
  title: string;
  author: string;
  publishedAt: string;
  canonicalUrl: string;
  wordCount: number;
  excerpt: string;
  inArticleImages: string[];
}

export function QuickRepurposeBar({
  workflows,
  templates,
  onArticleRepurposed,
}: QuickRepurposeBarProps): React.JSX.Element {
  const [tab, setTab] = useState<"url" | "text">("url");

  // Routing selection
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("default");

  // URL mode
  const [url, setUrl] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [preview, setPreview] = useState<ArticlePreview | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Text mode
  const [textTitle, setTextTitle] = useState("");
  const [rawText, setRawText] = useState("");

  // Ingest & Pipeline execution
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedArticleId, setCompletedArticleId] = useState<string | null>(null);

  const selectedWorkflow = workflows.find((w) => w.id === selectedWorkflowId);

  const handleInspectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setInspecting(true);
    setError(null);
    setPreview(null);
    setSelectedImage(null);
    setCompletedArticleId(null);

    try {
      const res = await fetch("/api/ingest/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to inspect article URL.");

      setPreview(data);
      if (data.inArticleImages && data.inArticleImages.length > 0) {
        setSelectedImage(data.inArticleImages[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to inspect URL.");
    } finally {
      setInspecting(false);
    }
  };

  const handleRunPipeline = async () => {
    setRunning(true);
    setError(null);
    setCompletedArticleId(null);

    try {
      const payload: any = {};

      if (selectedWorkflow) {
        payload.workflowConfig = {
          enabledFormats: selectedWorkflow.enabledFormats,
          cardTemplateId: selectedWorkflow.cardTemplateId,
          carouselTemplateId: selectedWorkflow.carouselTemplateId,
        };
      }

      if (tab === "url") {
        payload.url = preview ? preview.canonicalUrl : url.trim();
        if (selectedImage) payload.preferredImageUrl = selectedImage;
      } else {
        payload.rawText = rawText.trim();
        payload.title = textTitle.trim() || undefined;
      }

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to repurpose article.");

      setCompletedArticleId(data.articleId);
      if (onArticleRepurposed) onArticleRepurposed(data.articleId);
    } catch (err: any) {
      setError(err.message || "Failed to run repurposing pipeline.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-app-border bg-app-surface p-5 shadow-xs space-y-4">
      {/* Top Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-base font-bold text-app-ink">
            Repurpose a Single Article
          </h2>
          <p className="text-xs text-app-muted mt-0.5">
            Drop any article link or paste draft copy to run it through your publishing workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Workflow Routing Selector */}
          {workflows.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-app-muted font-mono">Use:</span>
              <select
                value={selectedWorkflowId}
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                className="text-xs rounded-md border border-app-border bg-app-surface px-2.5 py-1 text-app-ink shadow-xs"
              >
                <option value="default">Standard Repurpose</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg border border-app-border p-0.5 bg-app-subtle">
            <button
              type="button"
              onClick={() => setTab("url")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                tab === "url"
                  ? "bg-app-surface text-app-ink shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Article URL
            </button>
            <button
              type="button"
              onClick={() => setTab("text")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                tab === "text"
                  ? "bg-app-surface text-app-ink shadow-xs"
                  : "text-app-muted hover:text-app-ink"
              }`}
            >
              Paste Draft
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* URL Mode */}
      {tab === "url" ? (
        <div className="space-y-3">
          <form onSubmit={handleInspectUrl} className="flex gap-2">
            <input
              type="url"
              placeholder="https://techcrunch.com/article/grounded-editorial-strategy"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={inspecting || running}
              className="flex-1 text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink placeholder:text-app-muted shadow-xs focus:outline-none focus:ring-1 focus:ring-app-ink disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={inspecting || !url.trim()}
              className="px-4 py-2 text-xs font-medium rounded-md border border-app-border bg-app-subtle text-app-ink hover:bg-zinc-200 transition-colors shadow-xs disabled:opacity-50"
            >
              {inspecting ? "Inspecting..." : "Inspect"}
            </button>
            <button
              type="button"
              onClick={handleRunPipeline}
              disabled={running || !url.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-md bg-app-ink text-white hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {running ? "Processing..." : "Repurpose →"}
            </button>
          </form>

          {/* Unfurl Preview Snippet */}
          {preview && (
            <div className="rounded-lg border border-app-border bg-app-subtle/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Unfurl Preview • 0 Tokens
                </span>
                <span className="text-[11px] text-app-muted font-mono">
                  {preview.wordCount} words
                </span>
              </div>
              <h4 className="font-serif text-sm font-bold text-app-ink line-clamp-1">
                {preview.title}
              </h4>
              <p className="text-xs text-app-ink/80 italic bg-app-surface border border-app-border/60 rounded p-2.5 line-clamp-2">
                "{preview.excerpt}"
              </p>

              {/* In-Article Image Selection */}
              {preview.inArticleImages.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-app-muted block mb-1.5">
                    Select Lead Card Visual ({preview.inArticleImages.length} images)
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {preview.inArticleImages.map((imgUrl, idx) => {
                      const isSelected = selectedImage === imgUrl;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(imgUrl)}
                          className={`h-12 w-16 rounded border overflow-hidden flex-shrink-0 relative transition-all ${
                            isSelected
                              ? "border-emerald-600 ring-2 ring-emerald-500/40"
                              : "border-app-border opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Image ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          {isSelected && (
                            <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-600 text-[8px] text-white flex items-center justify-center font-bold">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Text Mode */
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Draft Title"
            value={textTitle}
            onChange={(e) => setTextTitle(e.target.value)}
            className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
          />
          <textarea
            rows={4}
            placeholder="Paste raw draft copy, markdown notes, or paywalled article content..."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full text-xs rounded-md border border-app-border bg-app-surface p-3 text-app-ink shadow-xs"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRunPipeline}
              disabled={running || rawText.trim().length < 20}
              className="px-5 py-2 text-xs font-semibold rounded-md bg-app-ink text-white hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {running ? "Processing Draft..." : "Repurpose Draft →"}
            </button>
          </div>
        </div>
      )}

      {/* Completion Banner */}
      {completedArticleId && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Article ingested and formats generated successfully!
          </div>
          <Link
            href="/inbox"
            className="text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 px-3 py-1.5 rounded-md shadow-xs hover:bg-emerald-100 transition-colors"
          >
            Review in Inbox →
          </Link>
        </div>
      )}
    </div>
  );
}

