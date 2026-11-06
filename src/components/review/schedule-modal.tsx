"use client";

/**
 * Schedule Post Modal
 * Allows scheduling all formats of an article on a date (Simple mode)
 * or scheduling individual formats with exact hours (Advanced mode).
 * System Layer: ui / review
 */

import React, { useState } from "react";
import Link from "next/link";
import { FormatOutputRecord } from "@/db/queries-format-outputs";

interface ScheduleModalProps {
  articleId: string;
  articleTitle: string;
  currentFormatId: string;
  siblingFormats: FormatOutputRecord[];
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScheduleModal({
  articleId,
  articleTitle,
  currentFormatId,
  siblingFormats,
  onClose,
  onSuccess,
}: ScheduleModalProps): React.JSX.Element {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Tomorrow as default date (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  // Simple mode state
  const [simpleDate, setSimpleDate] = useState(defaultDateStr);

  // Advanced mode state: mapping formatId -> { date, time, enabled }
  const [formatSchedules, setFormatSchedules] = useState<
    Record<string, { date: string; time: string; enabled: boolean }>
  >(() => {
    const map: Record<string, { date: string; time: string; enabled: boolean }> = {};
    for (const f of siblingFormats) {
      map[f.id] = {
        date: defaultDateStr,
        time: "09:00",
        enabled: true,
      };
    }
    return map;
  });

  const handleToggleFormat = (id: string) => {
    setFormatSchedules((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        enabled: !prev[id]?.enabled,
      },
    }));
  };

  const handleUpdateSchedule = (
    id: string,
    field: "date" | "time",
    val: string
  ) => {
    setFormatSchedules((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (!isAdvanced) {
        // Simple Mode: Schedule all formats for this article on simpleDate
        const res = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "schedule",
            mode: "simple",
            articleId,
            scheduledDate: simpleDate,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to schedule");
        setSuccessMessage(`Scheduled ${siblingFormats.length} format(s) for ${simpleDate}!`);
      } else {
        // Advanced Mode: Send per-format dates and times
        const items = Object.entries(formatSchedules)
          .filter(([_, conf]) => conf.enabled)
          .map(([formatId, conf]) => ({
            formatOutputId: formatId,
            scheduledAt: `${conf.date}T${conf.time}:00`,
            hasTime: true,
          }));

        if (items.length === 0) {
          throw new Error("Please select at least one format to schedule.");
        }

        const res = await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "schedule",
            mode: "advanced",
            items,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to schedule");
        setSuccessMessage(`Scheduled ${items.length} format(s) with custom timing!`);
      }

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while scheduling.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-app-border bg-app-surface shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-app-border px-6 py-4 bg-app-subtle/30">
          <div>
            <h2 className="text-base font-serif font-bold text-app-ink">
              Schedule for Calendar
            </h2>
            <p className="text-xs text-app-muted line-clamp-1">{articleTitle}</p>
          </div>

          {/* Advanced Mode Toggle */}
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
              isAdvanced
                ? "bg-app-ink text-white border-app-ink"
                : "bg-app-surface text-app-muted border-app-border hover:text-app-ink"
            }`}
          >
            <span>Advanced Mode</span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isAdvanced ? "bg-emerald-400" : "bg-zinc-400"
              }`}
            />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {successMessage ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-center space-y-3">
              <div className="flex items-center justify-center text-emerald-600 font-bold text-lg">
                ✓
              </div>
              <p className="text-xs font-semibold text-emerald-900">{successMessage}</p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/calendar"
                  className="rounded-md bg-app-ink px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 transition-colors shadow-xs"
                >
                  View on Calendar →
                </Link>
                <button
                  onClick={onClose}
                  className="rounded-md border border-app-border bg-app-surface px-4 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {!isAdvanced ? (
                /* Simple Mode: Whole Article on One Date */
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-app-ink">
                      Target Publishing Date
                    </label>
                    <input
                      type="date"
                      value={simpleDate}
                      onChange={(e) => setSimpleDate(e.target.value)}
                      className="w-full rounded-md border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink focus:border-app-accent focus:outline-none"
                    />
                    <p className="text-[11px] text-app-muted">
                      All generated formats for this article will be scheduled together on this day.
                    </p>
                  </div>

                  <div className="rounded-lg border border-app-border bg-app-subtle/30 p-3.5 space-y-2">
                    <span className="text-[10px] uppercase font-semibold text-app-muted tracking-wider">
                      Included Formats ({siblingFormats.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {siblingFormats.map((f) => (
                        <span
                          key={f.id}
                          className="rounded-md border border-app-border bg-app-surface px-2.5 py-1 text-[11px] font-mono text-app-ink capitalize"
                        >
                          {f.format_kind.replace("-", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Advanced Mode: Per-Format Timing Controls */
                <div className="space-y-4">
                  <p className="text-xs text-app-muted">
                    Configure individual dates and precise posting hours for each format variant.
                  </p>

                  <div className="space-y-2.5">
                    {siblingFormats.map((f) => {
                      const conf = formatSchedules[f.id] || {
                        date: defaultDateStr,
                        time: "09:00",
                        enabled: true,
                      };

                      return (
                        <div
                          key={f.id}
                          className={`rounded-lg border p-3 transition-colors ${
                            conf.enabled
                              ? "border-app-border bg-app-surface"
                              : "border-app-border/40 bg-app-subtle/20 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={conf.enabled}
                                onChange={() => handleToggleFormat(f.id)}
                                className="rounded text-app-accent focus:ring-0"
                              />
                              <span className="text-xs font-semibold capitalize text-app-ink font-mono">
                                {f.format_kind.replace("-", " ")}
                              </span>
                            </label>
                            {f.id === currentFormatId && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                                Current
                              </span>
                            )}
                          </div>

                          {conf.enabled && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <label className="text-[10px] text-app-muted block mb-0.5">
                                  Date
                                </label>
                                <input
                                  type="date"
                                  value={conf.date}
                                  onChange={(e) =>
                                    handleUpdateSchedule(f.id, "date", e.target.value)
                                  }
                                  className="w-full rounded border border-app-border bg-app-surface px-2 py-1.5 text-xs text-app-ink focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-app-muted block mb-0.5">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={conf.time}
                                  onChange={(e) =>
                                    handleUpdateSchedule(f.id, "time", e.target.value)
                                  }
                                  className="w-full rounded border border-app-border bg-app-surface px-2 py-1.5 text-xs text-app-ink focus:outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!successMessage && (
          <div className="flex items-center justify-end gap-3 border-t border-app-border px-6 py-4 bg-app-subtle/20">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-app-border bg-app-surface px-4 py-2 text-xs font-medium text-app-muted hover:text-app-ink transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="rounded-md bg-app-ink px-4 py-2 text-xs font-medium text-white shadow hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Scheduling..." : "Schedule Posts"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

