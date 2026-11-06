"use client";

/**
 * Workflow Builder Modal
 * Dialog overlay for creating or editing publication workflows (Articles & YouTube Channels).
 * System Layer: ui / feeds
 */

import React, { useState, useEffect } from "react";
import { WorkflowRecord, UserTemplateRecord } from "@/db/queries-brand-kit";
import { DiscoveredFeed } from "@/pipeline/1-ingest/discover-rss-feeds";
import { WorkflowYoutubeFields } from "@/components/feeds/workflow-youtube-fields";
import { WorkflowArticleFields } from "@/components/feeds/workflow-article-fields";

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  editingWorkflow: WorkflowRecord | null;
  templates: UserTemplateRecord[];
  onSave: (workflow: WorkflowRecord) => Promise<void>;
  onClose: () => void;
}

const POLL_INTERVALS = [
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every 1 hour (Standard)" },
  { value: 120, label: "Every 2 hours" },
  { value: 360, label: "Every 6 hours" },
  { value: 1440, label: "Daily (24 hours)" },
];

export function WorkflowBuilderModal({
  isOpen,
  editingWorkflow,
  templates,
  onSave,
  onClose,
}: WorkflowBuilderModalProps): React.JSX.Element | null {
  const [sourceType, setSourceType] = useState<"article" | "youtube">("article");
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [pollInterval, setPollInterval] = useState(60);

  // Article formats & templates
  const [cardTemplateId, setCardTemplateId] = useState<string | undefined>(undefined);
  const [carouselTemplateId, setCarouselTemplateId] = useState<string | undefined>(undefined);
  const [enabledFormats, setEnabledFormats] = useState<string[]>([
    "text-post",
    "thread",
    "card",
    "carousel",
  ]);

  // YouTube reel options
  const [videoReelTemplateId, setVideoReelTemplateId] = useState<string | undefined>(undefined);
  const [targetClipsCount, setTargetClipsCount] = useState<number>(3);
  const [targetDuration, setTargetDuration] = useState<"15-30" | "30-60" | "60-90">("30-60");
  const [language, setLanguage] = useState<string>("");
  const [vocabularyHint, setVocabularyHint] = useState<string>("");

  // Feed discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<DiscoveredFeed[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardTemplates = templates.filter((t) => t.format === "card");
  const carouselTemplates = templates.filter((t) => t.format === "carousel");

  useEffect(() => {
    if (editingWorkflow) {
      setSourceType(editingWorkflow.sourceType || "article");
      setName(editingWorkflow.name);
      setFeedUrl(editingWorkflow.feedUrl || "");
      setPollInterval(editingWorkflow.pollIntervalMinutes || 60);
      setCardTemplateId(editingWorkflow.cardTemplateId);
      setCarouselTemplateId(editingWorkflow.carouselTemplateId);
      setVideoReelTemplateId(editingWorkflow.videoReelTemplateId);
      setTargetClipsCount(editingWorkflow.targetClipsCount || 3);
      setTargetDuration(editingWorkflow.targetDuration || "30-60");
      setLanguage(editingWorkflow.language || "");
      setVocabularyHint(editingWorkflow.vocabularyHint || "");
      setEnabledFormats(
        editingWorkflow.enabledFormats && editingWorkflow.enabledFormats.length > 0
          ? editingWorkflow.enabledFormats
          : ["text-post", "thread", "card", "carousel"]
      );
    } else {
      setSourceType("article");
      setName("");
      setFeedUrl("");
      setPollInterval(60);
      setCardTemplateId(cardTemplates[0]?.id);
      setCarouselTemplateId(carouselTemplates[0]?.id);
      setVideoReelTemplateId(undefined);
      setTargetClipsCount(3);
      setTargetDuration("30-60");
      setLanguage("");
      setVocabularyHint("");
      setEnabledFormats(["text-post", "thread", "card", "carousel"]);
    }
    setDiscoveredFeeds([]);
    setError(null);
  }, [editingWorkflow, isOpen]);

  if (!isOpen) return null;

  const handleDiscoverFeed = async () => {
    if (!feedUrl.trim()) return;
    setDiscovering(true);
    setError(null);
    setDiscoveredFeeds([]);

    try {
      const res = await fetch("/api/feeds/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feedUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not detect publication feeds.");

      if (data.feeds && data.feeds.length > 0) {
        setDiscoveredFeeds(data.feeds);
        if (!name.trim()) {
          setName(data.feeds[0].title || (sourceType === "youtube" ? "YouTube Workflow" : "Publication Workflow"));
        }
        setFeedUrl(data.feeds[0].feedUrl);
      } else {
        setError(
          sourceType === "youtube"
            ? "No YouTube channel feed detected. Please enter a valid handle (e.g. @ChannelName) or channel URL."
            : "No feeds found at this URL. You can enter the exact XML link directly."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to detect feeds.");
    } finally {
      setDiscovering(false);
    }
  };

  const toggleFormat = (formatId: string) => {
    if (enabledFormats.includes(formatId)) {
      if (enabledFormats.length === 1) {
        setError("At least one format must remain enabled.");
        return;
      }
      setEnabledFormats(enabledFormats.filter((f) => f !== formatId));
    } else {
      setEnabledFormats([...enabledFormats, formatId]);
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name for this workflow.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const record: WorkflowRecord = {
        id: editingWorkflow?.id || `wf-${Date.now()}`,
        name: name.trim(),
        isActive: editingWorkflow ? editingWorkflow.isActive : true,
        sourceType,
        feedUrl: feedUrl.trim() || undefined,
        pollIntervalMinutes: pollInterval,
        enabledFormats: sourceType === "youtube" ? ["video-reel"] : enabledFormats,
        cardTemplateId: sourceType === "article" ? cardTemplateId || undefined : undefined,
        carouselTemplateId: sourceType === "article" ? carouselTemplateId || undefined : undefined,
        videoReelTemplateId: sourceType === "youtube" ? videoReelTemplateId : undefined,
        targetClipsCount: sourceType === "youtube" ? targetClipsCount : undefined,
        targetDuration: sourceType === "youtube" ? targetDuration : undefined,
        language: sourceType === "youtube" ? language.trim() || undefined : undefined,
        vocabularyHint: sourceType === "youtube" ? vocabularyHint.trim() || undefined : undefined,
        createdAt: editingWorkflow?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(record);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save workflow.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-xl border border-app-border bg-app-surface shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-app-border flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-app-ink">
              {editingWorkflow ? "Edit Publishing Workflow" : "New Publishing Workflow"}
            </h2>
            <p className="text-xs text-app-muted mt-0.5">
              Configure publication source, recurring poll frequency, and visual templates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-app-muted hover:text-app-ink p-1 rounded-md text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Source Type Selector */}
          <div>
            <label className="text-xs font-semibold text-app-ink block mb-1.5">
              Workflow Source Type
            </label>
            <div className="flex rounded-lg border border-app-border p-1 bg-app-subtle/40 max-w-sm">
              <button
                type="button"
                onClick={() => setSourceType("article")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  sourceType === "article"
                    ? "bg-app-surface text-app-ink shadow-xs font-bold"
                    : "text-app-muted hover:text-app-ink"
                }`}
              >
                <span>📰</span>
                <span>Article / RSS Feed</span>
              </button>
              <button
                type="button"
                onClick={() => setSourceType("youtube")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 ${
                  sourceType === "youtube"
                    ? "bg-app-surface text-app-ink shadow-xs font-bold"
                    : "text-app-muted hover:text-app-ink"
                }`}
              >
                <span>🔴</span>
                <span>YouTube Channel</span>
              </button>
            </div>
          </div>

          {/* Workflow Name */}
          <div>
            <label className="text-xs font-semibold text-app-ink block mb-1">
              Workflow Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={sourceType === "youtube" ? "e.g. UPB Drive Podcast Clips" : "e.g. Tech & Product Daily"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs focus:outline-none focus:ring-1 focus:ring-app-ink"
            />
          </div>

          {/* Feed URL & Auto-Discovery */}
          <div>
            <label className="text-xs font-semibold text-app-ink block mb-1">
              {sourceType === "youtube" ? "YouTube Channel Handle or Link" : "Source Publication URL (Optional)"}
            </label>
            <p className="text-[11px] text-app-muted mb-2">
              {sourceType === "youtube"
                ? "Enter channel handle (e.g. @UPBDrive), full channel link, or any video from the channel."
                : "Enter website (e.g. bbc.com/culture, techcrunch.com) or direct RSS link."}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={
                  sourceType === "youtube"
                    ? "@UPBDrive or https://youtube.com/@UPBDrive"
                    : "https://techcrunch.com or https://example.com/feed"
                }
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                disabled={discovering}
                className="flex-1 text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs font-mono"
              />
              <button
                type="button"
                onClick={handleDiscoverFeed}
                disabled={discovering || !feedUrl.trim()}
                className="px-3.5 py-2 text-xs font-medium rounded-md border border-app-border bg-app-subtle text-app-ink hover:bg-zinc-200 transition-colors shadow-xs disabled:opacity-50"
              >
                {discovering ? "Detecting..." : "Detect Feed"}
              </button>
            </div>

            {discoveredFeeds.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-emerald-900">
                  <span>Feed Detected: {discoveredFeeds[0].title}</span>
                  <span className="text-[10px] font-mono text-emerald-700">Ready</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-mono truncate">
                  {discoveredFeeds[0].feedUrl}
                </p>
              </div>
            )}
          </div>

          {/* Poll Rate */}
          {feedUrl.trim() && (
            <div>
              <label className="text-xs font-semibold text-app-ink block mb-1">
                Automated Poll Rate
              </label>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
              >
                {POLL_INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Source-Specific Config */}
          {sourceType === "youtube" ? (
            <WorkflowYoutubeFields
              templates={templates}
              videoReelTemplateId={videoReelTemplateId}
              onSelectVideoReelTemplateId={setVideoReelTemplateId}
              clipsCount={targetClipsCount}
              onChangeClipsCount={setTargetClipsCount}
              targetDuration={targetDuration}
              onChangeTargetDuration={setTargetDuration}
              language={language}
              onChangeLanguage={setLanguage}
              vocabularyHint={vocabularyHint}
              onChangeVocabularyHint={setVocabularyHint}
            />
          ) : (
            <WorkflowArticleFields
              cardTemplates={cardTemplates}
              carouselTemplates={carouselTemplates}
              cardTemplateId={cardTemplateId}
              onSelectCardTemplateId={setCardTemplateId}
              carouselTemplateId={carouselTemplateId}
              onSelectCarouselTemplateId={setCarouselTemplateId}
              enabledFormats={enabledFormats}
              onToggleFormat={toggleFormat}
            />
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-app-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-app-muted hover:text-app-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-md bg-app-ink text-white hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? "Saving..." : editingWorkflow ? "Save Changes" : "Create Workflow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
