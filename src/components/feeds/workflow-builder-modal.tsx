"use client";

/**
 * Workflow Builder Modal
 * Dialog overlay for creating or editing publishing workflows, assigning visual templates, and detecting feeds.
 * System Layer: ui / feeds
 */

import React, { useState, useEffect } from "react";
import { WorkflowRecord, UserTemplateRecord } from "@/db/queries-brand-kit";
import { DiscoveredFeed } from "@/pipeline/1-ingest/discover-rss-feeds";

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  editingWorkflow: WorkflowRecord | null;
  templates: UserTemplateRecord[];
  onSave: (workflow: WorkflowRecord) => Promise<void>;
  onClose: () => void;
}

const AVAILABLE_FORMATS = [
  { id: "text-post", label: "Text Post", description: "Single thought post" },
  { id: "thread", label: "Thread", description: "Multi-part breakdown" },
  { id: "card", label: "Graphic Card", description: "Visual quote or stat slide" },
  { id: "carousel", label: "Carousel Deck", description: "Multi-slide PDF deck" },
];

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
  const [name, setName] = useState("");
  const [feedUrl, setFeedUrl] = useState("");
  const [pollInterval, setPollInterval] = useState(60);
  const [cardTemplateId, setCardTemplateId] = useState<string | undefined>(undefined);
  const [carouselTemplateId, setCarouselTemplateId] = useState<string | undefined>(undefined);
  const [enabledFormats, setEnabledFormats] = useState<string[]>([
    "text-post",
    "thread",
    "card",
    "carousel",
  ]);

  // Feed discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discoveredFeeds, setDiscoveredFeeds] = useState<DiscoveredFeed[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardTemplates = templates.filter((t) => t.format === "card");
  const carouselTemplates = templates.filter((t) => t.format === "carousel");

  useEffect(() => {
    if (editingWorkflow) {
      setName(editingWorkflow.name);
      setFeedUrl(editingWorkflow.feedUrl || "");
      setPollInterval(editingWorkflow.pollIntervalMinutes || 60);
      setCardTemplateId(editingWorkflow.cardTemplateId);
      setCarouselTemplateId(editingWorkflow.carouselTemplateId);
      setEnabledFormats(
        editingWorkflow.enabledFormats && editingWorkflow.enabledFormats.length > 0
          ? editingWorkflow.enabledFormats
          : ["text-post", "thread", "card", "carousel"]
      );
    } else {
      setName("");
      setFeedUrl("");
      setPollInterval(60);
      setCardTemplateId(cardTemplates[0]?.id);
      setCarouselTemplateId(carouselTemplates[0]?.id);
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
        // Pre-fill name if empty
        if (!name.trim()) {
          setName(data.feeds[0].title || "Publication Workflow");
        }
        setFeedUrl(data.feeds[0].feedUrl);
      } else {
        setError("No feeds found at this URL. You can enter the exact XML link directly.");
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
        feedUrl: feedUrl.trim() || undefined,
        pollIntervalMinutes: pollInterval,
        enabledFormats,
        cardTemplateId: cardTemplateId || undefined,
        carouselTemplateId: carouselTemplateId || undefined,
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
              Configure publication feed, visual templates, and output formats.
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

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Workflow Name */}
          <div>
            <label className="text-xs font-semibold text-app-ink block mb-1">
              Workflow Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Tech & Product Daily, Culture Breakdown"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs focus:outline-none focus:ring-1 focus:ring-app-ink"
            />
          </div>

          {/* Source Feed & Discovery */}
          <div>
            <label className="text-xs font-semibold text-app-ink block mb-1">
              Source Publication URL (Optional)
            </label>
            <p className="text-[11px] text-app-muted mb-2">
              Enter any publication website (e.g. bbc.com/culture, techcrunch.com) or direct RSS link.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://techcrunch.com or https://example.com/feed"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                disabled={discovering}
                className="flex-1 text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs focus:outline-none focus:ring-1 focus:ring-app-ink"
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

            {/* Discovered Feeds Preview */}
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

          {/* Poll Interval */}
          {feedUrl.trim() && (
            <div>
              <label className="text-xs font-semibold text-app-ink block mb-1">
                Automated Poll Rate
              </label>
              <select
                value={pollInterval}
                onChange={(e) => setPollInterval(Number(e.target.value))}
                className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs focus:outline-none focus:ring-1 focus:ring-app-ink"
              >
                {POLL_INTERVALS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assigned Visual Templates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-app-border/60">
            <div>
              <label className="text-xs font-semibold text-app-ink block mb-1">
                Graphic Card Template
              </label>
              <select
                value={cardTemplateId || "default"}
                onChange={(e) =>
                  setCardTemplateId(e.target.value === "default" ? undefined : e.target.value)
                }
                className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
              >
                <option value="default">Default Editorial Card</option>
                {cardTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-app-ink block mb-1">
                Carousel Deck Template
              </label>
              <select
                value={carouselTemplateId || "default"}
                onChange={(e) =>
                  setCarouselTemplateId(e.target.value === "default" ? undefined : e.target.value)
                }
                className="w-full text-xs rounded-md border border-app-border bg-app-surface px-3 py-2 text-app-ink shadow-xs"
              >
                <option value="default">Default Editorial Deck</option>
                {carouselTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Enabled Pipeline Formats */}
          <div className="pt-2 border-t border-app-border/60">
            <label className="text-xs font-semibold text-app-ink block mb-2 font-mono uppercase tracking-wider text-app-muted">
              Enabled Output Formats
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_FORMATS.map((fmt) => {
                const active = enabledFormats.includes(fmt.id);
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => toggleFormat(fmt.id)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      active
                        ? "border-app-ink bg-app-subtle/80 font-medium"
                        : "border-app-border bg-app-surface opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-app-ink">{fmt.label}</span>
                      <span
                        className={`h-2 w-2 rounded-full ${
                          active ? "bg-emerald-500" : "bg-zinc-300"
                        }`}
                      />
                    </div>
                    <span className="text-[11px] text-app-muted">{fmt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

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

