"use client";

/**
 * Article Repurpose Panel
 * Ad-hoc workflow for single article URL inspection or raw draft text repurposing.
 * System Layer: ui / repurpose
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkflowRecord } from "@/db/queries-brand-kit";
import { ArticlePreview } from "@/components/repurpose/types";

interface ArticleRepurposePanelProps {
  workflows: WorkflowRecord[];
}

export function ArticleRepurposePanel({
  workflows,
}: ArticleRepurposePanelProps): React.JSX.Element {
  const router = useRouter();

  const [articleTab, setArticleTab] = useState<"url" | "text">("url");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("default");
  const [articleUrl, setArticleUrl] = useState("");
  const [inspectingUrl, setInspectingUrl] = useState(false);
  const [articlePreview, setArticlePreview] = useState<ArticlePreview | null>(null);
  const [selectedArticleImage, setSelectedArticleImage] = useState<string | null>(null);
  const [rawTitle, setRawTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [articleRunning, setArticleRunning] = useState(false);
  const [articleError, setArticleError] = useState<string | null>(null);
  const [completedArticleId, setCompletedArticleId] = useState<string | null>(null);

  const handleInspectArticleUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleUrl.trim()) return;
    setInspectingUrl(true);
    setArticleError(null);
    setArticlePreview(null);
    setSelectedArticleImage(null);
    setCompletedArticleId(null);

    try {
      const res = await fetch("/api/ingest/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to inspect article URL.");
      setArticlePreview(data);
      if (data.inArticleImages && data.inArticleImages.length > 0) {
        setSelectedArticleImage(data.inArticleImages[0]);
      }
    } catch (err: any) {
      setArticleError(err.message || "Failed to inspect URL.");
    } finally {
      setInspectingUrl(false);
    }
  };

  const handleRunArticlePipeline = async () => {
    setArticleRunning(true);
    setArticleError(null);
    setCompletedArticleId(null);

    const selectedWf = workflows.find((w) => w.id === selectedWorkflowId);

    try {
      const payload: Record<string, unknown> = {};
      if (selectedWf) {
        payload.workflowConfig = {
          enabledFormats: selectedWf.enabledFormats,
          cardTemplateId: selectedWf.cardTemplateId,
          carouselTemplateId: selectedWf.carouselTemplateId,
        };
      }
      if (selectedArticleImage) {
        payload.preferredImageUrl = selectedArticleImage;
      }

      let res: Response;
      if (articleTab === "url") {
        if (!articleUrl.trim()) throw new Error("Please enter an article URL.");
        res = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: articleUrl.trim(), ...payload }),
        });
      } else {
        if (!rawTitle.trim() || !rawText.trim()) {
          throw new Error("Please provide both a title and article body text.");
        }
        res = await fetch("/api/ingest/raw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: rawTitle.trim(),
            cleanText: rawText.trim(),
            ...payload,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process article.");

      setCompletedArticleId(data.articleId);
      router.refresh();
    } catch (err: any) {
      setArticleError(err.message || "Pipeline execution failed.");
    } finally {
      setArticleRunning(false);
    }
  };

  return (
    <div className="bg-app-surface border border-app-border rounded-xl p-6 shadow-xs space-y-6">
      {/* Sub-tabs: URL vs Raw Text */}
      <div className="flex items-center gap-3 border-b border-app-border pb-4">
        <button
          type="button"
          onClick={() => setArticleTab("url")}
          className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
            articleTab === "url"
              ? "border-app-ink text-app-ink font-bold"
              : "border-transparent text-app-muted hover:text-app-ink"
          }`}
        >
          Public Article URL
        </button>
        <button
          type="button"
          onClick={() => setArticleTab("text")}
          className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${
            articleTab === "text"
              ? "border-app-ink text-app-ink font-bold"
              : "border-transparent text-app-muted hover:text-app-ink"
          }`}
        >
          Raw Article Text / Newsletter Draft
        </button>
      </div>

      {articleTab === "url" ? (
        <form onSubmit={handleInspectArticleUrl} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-app-ink mb-1.5">
              Article Publication URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="https://example.com/blog/grounded-article-slug"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                className="flex-1 rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent shadow-2xs font-mono"
              />
              <button
                type="submit"
                disabled={inspectingUrl || !articleUrl.trim()}
                className="rounded-md border border-app-border bg-app-surface px-4 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle disabled:opacity-50 transition-colors shadow-2xs"
              >
                {inspectingUrl ? "Inspecting..." : "Inspect"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-app-ink mb-1">
              Article Title
            </label>
            <input
              type="text"
              placeholder="e.g. Knocker Uppers & Candle Clocks: How People Woke Up Before Alarms"
              value={rawTitle}
              onChange={(e) => setRawTitle(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink font-serif font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-ink mb-1">
              Clean Article Body Text
            </label>
            <textarea
              rows={8}
              placeholder="Paste your newsletter draft, essay, or raw article text here..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full rounded-md border border-app-border bg-app-surface p-3 text-xs text-app-ink font-mono"
            />
          </div>
        </div>
      )}

      {/* Article Inspection Preview Card */}
      {articlePreview && (
        <div className="p-4 rounded-lg border border-app-border bg-app-subtle/30 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-serif font-bold text-sm text-app-ink">
                {articlePreview.title}
              </h4>
              <p className="text-[11px] text-app-muted mt-0.5 font-mono">
                {articlePreview.wordCount} words · {articlePreview.author || "Unknown author"}
              </p>
            </div>
          </div>

          {/* In-article image picker */}
          {articlePreview.inArticleImages && articlePreview.inArticleImages.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-app-muted uppercase block mb-1.5">
                Select Card Image:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {articlePreview.inArticleImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="Article figure"
                    onClick={() => setSelectedArticleImage(img)}
                    className={`h-16 w-24 object-cover rounded cursor-pointer border-2 transition-all ${
                      selectedArticleImage === img
                        ? "border-app-accent scale-105 shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflow Route Selection */}
      <div className="border-t border-app-border pt-4 space-y-2">
        <label className="block text-xs font-medium text-app-ink">
          Route Through Workflow / Template Settings
        </label>
        <select
          value={selectedWorkflowId}
          onChange={(e) => setSelectedWorkflowId(e.target.value)}
          className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink"
        >
          <option value="default">Default Formats (All 4 formats: Text, Thread, Card, Carousel)</option>
          {workflows.map((wf) => (
            <option key={wf.id} value={wf.id}>
              {wf.name} ({wf.enabledFormats.join(", ")})
            </option>
          ))}
        </select>
      </div>

      {articleError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {articleError}
        </div>
      )}

      {/* Trigger Button */}
      <div>
        <button
          type="button"
          onClick={handleRunArticlePipeline}
          disabled={articleRunning}
          className="w-full rounded-lg bg-app-ink py-2.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-sm"
        >
          {articleRunning ? "Generating Grounded Drafts..." : "Generate Social Formats"}
        </button>
      </div>

      {completedArticleId && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <span>✓ Formats generated successfully!</span>
          <Link
            href="/inbox"
            className="font-bold underline hover:text-emerald-950"
          >
            Go to Drafts Inbox →
          </Link>
        </div>
      )}
    </div>
  );
}

