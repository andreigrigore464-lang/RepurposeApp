"use client";

/**
 * Publishing Workflows Manager Component
 * Master container coordinating workflows list, interactive builder modal, and quick repurposing bar.
 * System Layer: ui / feeds
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkflowRecord, UserTemplateRecord } from "@/db/queries-brand-kit";
import { FeedRecord } from "@/db/queries-feeds";
import { WorkflowCard } from "./workflow-card";
import { WorkflowBuilderModal } from "./workflow-builder-modal";

interface FeedsManagerProps {
  initialWorkflows: WorkflowRecord[];
  templates: UserTemplateRecord[];
  initialFeeds: FeedRecord[];
}

export function FeedsManager({
  initialWorkflows,
  templates,
  initialFeeds,
}: FeedsManagerProps): React.JSX.Element {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>(initialWorkflows);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRecord | null>(null);
  const [pollingWfId, setPollingWfId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setEditingWorkflow(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (wf: WorkflowRecord) => {
    setEditingWorkflow(wf);
    setModalOpen(true);
  };

  const handleSaveWorkflow = async (workflow: WorkflowRecord) => {
    const res = await fetch("/api/workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflow }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save workflow.");

    setWorkflows(data.workflows);
    router.refresh();
  };

  const handleToggleActive = async (wf: WorkflowRecord) => {
    const updated = { ...wf, isActive: !wf.isActive };
    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: updated }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status.");

      setWorkflows(data.workflows);
      router.refresh();
    } catch (err: any) {
      alert(`Could not update workflow: ${err.message}`);
    }
  };

  const handleDuplicate = async (wf: WorkflowRecord) => {
    const clone: WorkflowRecord = {
      ...wf,
      id: `wf-${Date.now()}`,
      name: `${wf.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: clone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate workflow.");

      setWorkflows(data.workflows);
      router.refresh();
    } catch (err: any) {
      alert(`Could not duplicate workflow: ${err.message}`);
    }
  };

  const handleDelete = async (wf: WorkflowRecord) => {
    if (!confirm(`Are you sure you want to delete workflow "${wf.name}"?`)) return;

    try {
      const res = await fetch(`/api/workflow?id=${wf.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete workflow.");

      setWorkflows(data.workflows);
      router.refresh();
    } catch (err: any) {
      alert(`Could not delete workflow: ${err.message}`);
    }
  };

  const handlePollNow = async (wf: WorkflowRecord) => {
    if (!wf.feedId) return;
    setPollingWfId(wf.id);

    try {
      const res = await fetch("/api/feeds/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedId: wf.feedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Poll failed.");

      alert(data.message || `Polled feed successfully: found ${data.newArticlesCount} new articles.`);
      router.refresh();
    } catch (err: any) {
      alert(`Poll failed: ${err.message}`);
    } finally {
      setPollingWfId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-app-ink tracking-tight">
            Publishing Workflows
          </h1>
          <p className="text-sm text-app-muted mt-1">
            Configure automated syndication pipelines, assign visual templates, and manage active publishing channels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="rounded-md bg-app-ink px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-xs"
        >
          + New Workflow
        </button>
      </div>

      {/* 1. One-Time Studio Callout */}
      <div className="rounded-lg border border-app-border bg-app-subtle/30 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-app-muted">
          <span className="text-sm">⚡</span>
          <span>Looking to repurpose a single article, video file, or YouTube link?</span>
        </div>
        <Link
          href="/repurpose"
          className="rounded border border-app-border bg-app-surface px-3 py-1 text-xs font-semibold text-app-ink hover:bg-app-subtle transition-colors shadow-2xs text-center"
        >
          Open Repurpose Studio →
        </Link>
      </div>

      {/* 2. Workflows Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold font-mono uppercase tracking-wider text-app-muted">
            Active Workflows ({workflows.length})
          </h2>
        </div>

        {workflows.length === 0 ? (
          /* Honest, clean empty state */
          <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-12 text-center space-y-3">
            <h3 className="font-serif text-base font-bold text-app-ink">
              No publishing workflows created yet
            </h3>
            <p className="text-xs text-app-muted max-w-md mx-auto">
              Create an automated workflow to syndicate content from an RSS publication or configure custom template pairings for your brand.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenCreate}
                className="rounded-md bg-app-ink px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-xs"
              >
                + Create Your First Workflow
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((wf) => {
              const cardTpl = templates.find((t) => t.id === wf.cardTemplateId);
              const carouselTpl = templates.find((t) => t.id === wf.carouselTemplateId);

              return (
                <WorkflowCard
                  key={wf.id}
                  workflow={wf}
                  cardTemplate={cardTpl}
                  carouselTemplate={carouselTpl}
                  onToggleActive={handleToggleActive}
                  onEdit={handleOpenEdit}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onPollNow={handlePollNow}
                  isPolling={pollingWfId === wf.id}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Builder Modal */}
      <WorkflowBuilderModal
        isOpen={modalOpen}
        editingWorkflow={editingWorkflow}
        templates={templates}
        onSave={handleSaveWorkflow}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
