"use client";

/**
 * Publish Post Modal
 * Frictionless manual dispatch (1-click copy text, download visual assets, mark published)
 * and 1-time Auto-Posting Trust Poll.
 * System Layer: ui / calendar
 */

import React, { useState } from "react";
import { ScheduledOutputItem } from "@/db/queries-calendar";
import { ALL_PLATFORMS } from "@/registries/platforms/all-platforms";

interface PublishPostModalProps {
  item: ScheduledOutputItem;
  hasVotedTrust: boolean;
  onClose: () => void;
  onPublishedSuccess: (formatOutputId: string) => void;
  onVotedSuccess: () => void;
}

export function PublishPostModal({
  item,
  hasVotedTrust,
  onClose,
  onPublishedSuccess,
  onVotedSuccess,
}: PublishPostModalProps): React.JSX.Element {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    item.variants?.[0]?.platform_id || "linkedin"
  );
  const [copiedText, setCopiedText] = useState(false);
  const [isMarkingPublished, setIsMarkingPublished] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);

  const activeVariant =
    item.variants?.find((v) => v.platform_id === selectedPlatform) ||
    item.variants?.[0];

  const payload = (activeVariant?.adapted_payload || {}) as Record<string, any>;
  const postText: string =
    typeof payload.text === "string"
      ? payload.text
    : Array.isArray(payload.posts)
    ? payload.posts.join("\n\n---\n\n")
    : JSON.stringify(payload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(postText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleMarkPublished = async () => {
    setIsMarkingPublished(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          formatOutputId: item.id,
        }),
      });
      if (res.ok) {
        onPublishedSuccess(item.id);
        onClose();
      }
    } catch (err) {
      console.error("Failed to mark as published:", err);
    } finally {
      setIsMarkingPublished(false);
    }
  };

  const handleVote = async (vote: "yes" | "no") => {
    setIsSubmittingVote(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote_trust",
          vote,
        }),
      });
      if (res.ok) {
        setVoteSubmitted(true);
        setVoteFeedback(
          vote === "yes"
            ? "Thank you! We're prioritizing secure account auto-publishing."
            : "Understood! We'll keep manual posting smooth and control in your hands."
        );
        onVotedSuccess();
      }
    } catch (err) {
      console.error("Failed to submit vote:", err);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const isCard = item.format_kind === "card";
  const isCarousel = item.format_kind === "carousel";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl border border-app-border bg-app-surface shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-app-border px-6 py-4 bg-app-subtle/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold px-2 py-0.5 rounded bg-app-subtle text-app-ink">
                {item.format_kind.replace("-", " ")}
              </span>
              <h2 className="text-base font-serif font-bold text-app-ink">
                Ready to Publish
              </h2>
            </div>
            <p className="text-xs text-app-muted line-clamp-1 mt-0.5">
              {item.article?.title || "Article Post"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-app-muted hover:text-app-ink text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Transparency & Auto-Posting Trust Poll (Shown only once) */}
          {!hasVotedTrust && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 transition-all">
              <div className="flex items-start gap-2.5">
                <span className="text-amber-600 text-sm">💡</span>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Why Manual Dispatch?
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    We intentionally do not connect to your social media accounts yet.
                    Small teams and creators prefer knowing that no AI can publish
                    unvetted content to their personal or company channels without explicit review.
                  </p>
                </div>
              </div>

              {!voteSubmitted ? (
                <div className="pt-2 border-t border-amber-200/80 space-y-2">
                  <p className="text-[11px] font-semibold text-amber-950">
                    Once you trust your workflows, would you want us to auto-post directly for you?
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote("yes")}
                      disabled={isSubmittingVote}
                      className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-800 transition-colors disabled:opacity-50"
                    >
                      Yes, I'd use auto-posting
                    </button>
                    <button
                      onClick={() => handleVote("no")}
                      disabled={isSubmittingVote}
                      className="rounded-md border border-amber-300 bg-amber-100/60 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                      No, I prefer manual posting
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2">
                  ✓ {voteFeedback}
                </div>
              )}
            </div>
          )}

          {/* Platform Variant Switcher */}
          {item.variants && item.variants.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-app-ink block">
                Target Platform
              </label>
              <div className="flex flex-wrap gap-1.5">
                {item.variants.map((variant) => {
                  const isSelected = variant.platform_id === selectedPlatform;
                  return (
                    <button
                      key={variant.platform_id}
                      onClick={() => setSelectedPlatform(variant.platform_id)}
                      className={`capitalize rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-app-ink text-white font-semibold shadow-xs"
                          : "border border-app-border bg-app-surface text-app-muted hover:text-app-ink"
                      }`}
                    >
                      {variant.platform_id}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Copyable Post Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-app-ink">
                Formatted Post Copy
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-app-accent hover:underline font-medium"
              >
                {copiedText ? "✓ Copied!" : "Copy Text"}
              </button>
            </div>
            <div className="relative rounded-lg border border-app-border bg-app-subtle/30 p-3.5 max-h-48 overflow-y-auto">
              <pre className="text-xs font-sans text-app-ink whitespace-pre-wrap leading-relaxed select-all">
                {postText}
              </pre>
            </div>
          </div>

          {/* Visual Asset Downloads */}
          {(isCard || isCarousel) && (
            <div className="rounded-lg border border-app-border bg-app-surface p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-app-ink block">
                  Visual Media Assets
                </span>
                <p className="text-[11px] text-app-muted">
                  {isCard ? "Single high-res PNG image" : "Multi-slide PDF ready for LinkedIn carousel"}
                </p>
              </div>

              {isCard && (
                <a
                  href={`/api/export?formatId=${item.id}&type=png`}
                  download
                  className="rounded-md border border-app-border bg-app-surface px-3.5 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
                >
                  Download PNG
                </a>
              )}

              {isCarousel && (
                <a
                  href={`/api/export?formatId=${item.id}&type=pdf`}
                  download
                  className="rounded-md border border-app-border bg-app-surface px-3.5 py-1.5 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
                >
                  Download Carousel PDF
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-app-border px-6 py-4 bg-app-subtle/20">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-md border border-app-border bg-app-surface px-3.5 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            <span>{copiedText ? "✓ Copied to Clipboard" : "Copy Post Text"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-app-border bg-app-surface px-3.5 py-2 text-xs font-medium text-app-muted hover:text-app-ink transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleMarkPublished}
              disabled={isMarkingPublished || item.status === "published"}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>✓</span>
              <span>
                {item.status === "published"
                  ? "Already Published"
                  : isMarkingPublished
                  ? "Saving..."
                  : "Mark as Published"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

