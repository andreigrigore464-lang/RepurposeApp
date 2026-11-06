"use client";

/**
 * Calendar Workspace Component
 * Monthly interactive calendar grid with a pinned 'Today's Posts' sidebar and Fullscreen Day View.
 * System Layer: ui / calendar
 */

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ScheduledOutputItem } from "@/db/queries-calendar";
import { DayFullscreenModal } from "./day-fullscreen-modal";
import { PublishPostModal } from "./publish-post-modal";

interface CalendarWorkspaceProps {
  initialItems: ScheduledOutputItem[];
  initialTrustVote: {
    hasVoted: boolean;
    vote?: "yes" | "no" | null;
  };
}

export function CalendarWorkspace({
  initialItems,
  initialTrustVote,
}: CalendarWorkspaceProps): React.JSX.Element {
  const [items, setItems] = useState<ScheduledOutputItem[]>(initialItems);
  const [hasVotedTrust, setHasVotedTrust] = useState(initialTrustVote.hasVoted);

  // Month navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Fullscreen day selection
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  // Quick publish item modal from sidebar
  const [quickPublishItem, setQuickPublishItem] = useState<ScheduledOutputItem | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleTodayMonth = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  // Today's date string YYYY-MM-DD
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Group items by date string (YYYY-MM-DD)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ScheduledOutputItem[]>();
    for (const item of items) {
      const scheduledAt = item.slots_data?.scheduled_at;
      if (!scheduledAt) continue;
      const datePart = scheduledAt.split("T")[0];
      const list = map.get(datePart) || [];
      list.push(item);
      map.set(datePart, list);
    }
    return map;
  }, [items]);

  // Today's items
  const todayItems = useMemo(() => {
    return itemsByDate.get(todayStr) || [];
  }, [itemsByDate, todayStr]);

  // Calendar Grid Days Calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      items: ScheduledOutputItem[];
    }> = [];

    // Previous month tail days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        items: itemsByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        items: itemsByDate.get(dateStr) || [],
      });
    }

    // Next month head days (fill to 35 or 42 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        items: itemsByDate.get(dateStr) || [],
      });
    }

    return days;
  }, [year, month, todayStr, itemsByDate]);

  const handleItemPublished = (formatOutputId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === formatOutputId ? { ...item, status: "published" } : item
      )
    );
  };

  const handleItemUnscheduled = (formatOutputId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== formatOutputId));
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-app-ink tracking-tight">
            Editorial Calendar
          </h1>
          <p className="text-xs text-app-muted mt-0.5">
            Plan, inspect, and dispatch scheduled article posts across your target platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inbox"
            className="rounded-md border border-app-border bg-app-surface px-4 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            Review & Schedule More Drafts →
          </Link>
        </div>
      </div>

      {/* Main Grid: Left 8 Cols = Calendar Grid, Right 4 Cols = Today's Posts Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-8 bg-app-surface border border-app-border rounded-xl shadow-xs overflow-hidden">
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-app-border bg-app-subtle/30">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-serif font-bold text-app-ink">
                {monthName} {year}
              </h2>
              <button
                onClick={handleTodayMonth}
                className="text-[11px] font-medium border border-app-border bg-app-surface rounded px-2 py-0.5 text-app-ink hover:bg-app-subtle transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded hover:bg-app-subtle text-app-ink text-xs font-bold transition-colors"
                title="Previous Month"
              >
                ← Prev
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded hover:bg-app-subtle text-app-ink text-xs font-bold transition-colors"
                title="Next Month"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 border-b border-app-border bg-app-subtle/20 text-center py-2 text-[11px] font-semibold text-app-muted uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-app-border bg-app-border">
            {calendarDays.map((cell, idx) => {
              const hasItems = cell.items.length > 0;
              const scheduledCount = cell.items.filter((i) => i.status === "scheduled").length;
              const publishedCount = cell.items.filter((i) => i.status === "published").length;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayStr(cell.dateStr)}
                  className={`min-h-[105px] p-2 bg-app-surface cursor-pointer hover:bg-app-subtle/40 transition-colors flex flex-col justify-between group ${
                    !cell.isCurrentMonth ? "opacity-40" : ""
                  } ${cell.isToday ? "bg-amber-50/20" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium rounded-full h-6 w-6 flex items-center justify-center ${
                        cell.isToday
                          ? "bg-app-ink text-white font-bold"
                          : "text-app-ink group-hover:text-app-accent"
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {hasItems && (
                      <span className="text-[10px] font-mono text-app-muted group-hover:text-app-ink">
                        {cell.items.length} post{cell.items.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Items Badges */}
                  <div className="space-y-1 mt-1">
                    {cell.items.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium border flex items-center justify-between ${
                          item.status === "published"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-900 border-amber-200"
                        }`}
                      >
                        <span className="capitalize truncate font-mono">
                          {item.format_kind.replace("-", " ")}
                        </span>
                        {item.status === "published" && (
                          <span className="text-[8px] font-bold text-emerald-600">✓</span>
                        )}
                      </div>
                    ))}

                    {cell.items.length > 2 && (
                      <div className="text-[9px] text-app-muted text-center font-mono">
                        +{cell.items.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Pinned "Today's Posts" Sidebar */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="text-sm font-serif font-bold text-app-ink">
                  Today's Posts
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-app-subtle text-app-ink">
                {todayItems.length}
              </span>
            </div>

            {todayItems.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <span className="text-2xl">☕</span>
                <p className="text-xs font-semibold text-app-ink">
                  All clear for today!
                </p>
                <p className="text-[11px] text-app-muted max-w-xs mx-auto">
                  No posts scheduled for today. Review your drafts inbox to schedule future posts.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {todayItems.map((item) => {
                  const isPublished = item.status === "published";
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-3.5 space-y-2.5 transition-all ${
                        isPublished
                          ? "border-emerald-200 bg-emerald-50/20"
                          : "border-app-border bg-app-subtle/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-app-surface border border-app-border text-app-ink">
                          {item.format_kind.replace("-", " ")}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isPublished
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-app-ink line-clamp-1">
                        {item.article?.title || "Repurposed Article"}
                      </h4>

                      <div className="flex items-center justify-between pt-1">
                        <Link
                          href={`/review/${item.id}`}
                          className="text-[11px] text-app-muted hover:text-app-ink"
                        >
                          Review ↗
                        </Link>

                        <button
                          onClick={() => setQuickPublishItem(item)}
                          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                            isPublished
                              ? "bg-app-surface border border-app-border text-app-ink hover:bg-app-subtle"
                              : "bg-app-ink text-white hover:bg-zinc-800 shadow-xs"
                          }`}
                        >
                          {isPublished ? "View Copy" : "Ready to Post →"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expand Today in Fullscreen */}
            <button
              onClick={() => setSelectedDayStr(todayStr)}
              className="w-full rounded-md border border-app-border bg-app-surface py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
            >
              Open Today in Fullscreen View →
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Day Modal */}
      {selectedDayStr && (
        <DayFullscreenModal
          dateStr={selectedDayStr}
          items={itemsByDate.get(selectedDayStr) || []}
          hasVotedTrust={hasVotedTrust}
          onClose={() => setSelectedDayStr(null)}
          onItemPublished={handleItemPublished}
          onItemUnscheduled={handleItemUnscheduled}
          onVotedSuccess={() => setHasVotedTrust(true)}
        />
      )}

      {/* Quick Publish Modal From Sidebar */}
      {quickPublishItem && (
        <PublishPostModal
          item={quickPublishItem}
          hasVotedTrust={hasVotedTrust}
          onClose={() => setQuickPublishItem(null)}
          onPublishedSuccess={(id) => {
            handleItemPublished(id);
            setQuickPublishItem(null);
          }}
          onVotedSuccess={() => setHasVotedTrust(true)}
        />
      )}
    </div>
  );
}

