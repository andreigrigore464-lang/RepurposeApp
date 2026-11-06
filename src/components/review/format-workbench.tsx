"use client";

/**
 * Editorial Review & Editing Workbench
 * Comprehensive workbench offering platform variant adaptation, editable copy, live canvas preview, and export.
 * System Layer: ui / review
 */

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FormatOutputRecord } from "@/db/queries-format-outputs";
import { ArticleRecord } from "@/db/queries-articles";
import { PlatformVariantRecord } from "@/db/queries-platform-variants";
import { DigestItem } from "@/pipeline/2-digest/digest-schema";
import { BrandTheme } from "@/render/layout/resolve-slots";
import { Template } from "@/render/template-schema";
import { ALL_PLATFORMS } from "@/registries/platforms/all-platforms";
import { GroundingProvenancePanel } from "./grounding-provenance-panel";
import { ScheduleModal } from "./schedule-modal";
import { VideoReelPlayer } from "./video-reel-player";

const RenderInBrowser = dynamic(
  () => import("@/render/render-in-browser").then((mod) => mod.RenderInBrowser),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 w-72 bg-app-subtle flex items-center justify-center rounded-lg text-xs text-app-muted">
        Loading canvas preview...
      </div>
    ),
  }
);

interface FormatWorkbenchProps {
  formatOutput: FormatOutputRecord;
  article: ArticleRecord;
  platformVariants: PlatformVariantRecord[];
  siblingFormats?: FormatOutputRecord[];
  digestItems: DigestItem[];
  brandTheme: BrandTheme;
  cardTemplate?: Template;
  carouselTemplate?: Template;
}

export function FormatWorkbench({
  formatOutput,
  article,
  platformVariants,
  siblingFormats = [],
  digestItems,
  brandTheme,
  cardTemplate,
  carouselTemplate,
}: FormatWorkbenchProps): React.JSX.Element {
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    platformVariants[0]?.platform_id || "linkedin"
  );
  const [carouselSlideIndex, setCarouselSlideIndex] = useState(0);
  const [copiedText, setCopiedText] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const activeVariant =
    platformVariants.find((v) => v.platform_id === selectedPlatform) ||
    platformVariants[0];

  const payload = (activeVariant?.adapted_payload || {}) as Record<string, any>;
  const postText: string =
    typeof payload.text === "string"
      ? payload.text
      : Array.isArray(payload.posts)
      ? payload.posts.join("\n\n---\n\n")
      : JSON.stringify(payload, null, 2);

  const [editableText, setEditableText] = useState(postText);

  // Update text when platform tab changes
  const handleSelectPlatform = (platformId: string) => {
    setSelectedPlatform(platformId);
    const targetVariant = platformVariants.find((v) => v.platform_id === platformId);
    const p = (targetVariant?.adapted_payload || {}) as Record<string, any>;
    const t =
      typeof p.text === "string"
        ? p.text
        : Array.isArray(p.posts)
        ? p.posts.join("\n\n---\n\n")
        : JSON.stringify(p, null, 2);
    setEditableText(t);
  };

  const platformDef = ALL_PLATFORMS.find((p) => p.id === selectedPlatform);
  const charLimit = platformDef?.constraints.maxCharacters ?? 2000;
  const currentCharCount = editableText.length;
  const isOverLimit = currentCharCount > charLimit;

  const handleCopyPost = () => {
    navigator.clipboard.writeText(editableText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const isVisualFormat =
    formatOutput.format_kind === "card" || formatOutput.format_kind === "carousel";

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-app-muted mb-1">
            <Link href="/inbox" className="hover:text-app-ink transition-colors">
              ← Drafts Inbox
            </Link>
            <span>/</span>
            <span className="font-mono uppercase font-semibold text-app-ink">
              {formatOutput.format_kind}
            </span>
          </div>
          <h1 className="text-xl font-serif font-bold text-app-ink tracking-tight line-clamp-1">
            {article.title}
          </h1>
        </div>

        {/* Global Export & Schedule Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-app-border bg-app-surface px-3.5 py-2 text-xs font-semibold text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            <span>📅</span>
            <span>Schedule</span>
          </button>

          <button
            onClick={handleCopyPost}
            className="flex items-center gap-1.5 rounded-md border border-app-border bg-app-surface px-3.5 py-2 text-xs font-medium text-app-ink hover:bg-app-subtle transition-colors shadow-xs"
          >
            {copiedText ? (
              <>
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <span>Copy Post Text</span>
              </>
            )}
          </button>

          {formatOutput.format_kind === "card" && (
            <a
              href={`/api/export?formatId=${formatOutput.id}&type=png`}
              download
              className="rounded-md bg-app-accent px-4 py-2 text-xs font-medium text-white shadow hover:bg-app-accent-hover transition-colors inline-block"
            >
              Download PNG
            </a>
          )}

          {formatOutput.format_kind === "carousel" && (
            <a
              href={`/api/export?formatId=${formatOutput.id}&type=pdf`}
              download
              className="rounded-md bg-app-accent px-4 py-2 text-xs font-medium text-white shadow hover:bg-app-accent-hover transition-colors inline-block"
            >
              Download Carousel PDF
            </a>
          )}
        </div>
      </div>

      {/* Main Grid: Left Editor & Preview, Right Grounding Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Video Reel Player OR Written Platform Switcher & Canvas */}
        <div className="lg:col-span-7 space-y-6">
          {formatOutput.format_kind === "video-reel" ? (
            <VideoReelPlayer
              formatOutput={formatOutput}
              article={article}
              onOpenSchedule={() => setIsScheduleModalOpen(true)}
            />
          ) : (
            <>
              {/* Platform Variant Switcher */}
              <div className="bg-app-surface border border-app-border rounded-lg p-2 shadow-xs flex flex-wrap gap-1">
            {platformVariants.map((variant) => {
              const isSelected = variant.platform_id === selectedPlatform;
              return (
                <button
                  key={variant.platform_id}
                  onClick={() => handleSelectPlatform(variant.platform_id)}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-app-ink text-white font-semibold shadow-xs"
                      : "text-app-muted hover:bg-app-subtle hover:text-app-ink"
                  }`}
                >
                  <span className="capitalize">{variant.platform_id}</span>
                  {!variant.is_valid && (
                    <span className="rounded-full bg-amber-400 h-1.5 w-1.5" title="Warnings reported" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Character Count & Truncation Warnings */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2">
              <span className="text-app-muted font-mono">Character Count:</span>
              <span
                className={`font-mono font-semibold px-2 py-0.5 rounded text-[11px] ${
                  isOverLimit
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : currentCharCount > charLimit * 0.9
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-app-subtle text-app-ink border border-app-border"
                }`}
              >
                {currentCharCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>

            {isOverLimit && (
              <span className="text-red-600 text-[11px] font-medium">
                Exceeds {selectedPlatform.toUpperCase()} limit by {currentCharCount - charLimit} chars
              </span>
            )}
          </div>

          {/* Copy Editor Area */}
          <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-3 border-b border-app-border bg-app-subtle/30 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-app-muted uppercase tracking-wider">
                Adapted Content ({selectedPlatform})
              </span>
              <span className="text-[10px] text-app-muted">Directly editable</span>
            </div>
            <textarea
              rows={8}
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="w-full text-xs font-sans leading-relaxed p-4 bg-transparent text-app-ink focus:outline-none resize-y"
              placeholder="Adapted social text..."
            />
          </div>

          {/* Live Visual Canvas Preview for Card / Carousel */}
          {isVisualFormat && (
            <div className="bg-app-surface border border-app-border rounded-lg p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-app-ink">
                    Interactive Canvas Preview
                  </h3>
                  <p className="text-[11px] text-app-muted">
                    Rendered via Konva with brand theme tokens and live slot data.
                  </p>
                </div>

                {/* Carousel Page Navigation */}
                {formatOutput.format_kind === "carousel" && carouselTemplate && (
                  <div className="flex items-center gap-2 border border-app-border rounded-md bg-app-subtle/50 px-2 py-1 text-xs">
                    <button
                      onClick={() => setCarouselSlideIndex((prev) => Math.max(0, prev - 1))}
                      disabled={carouselSlideIndex === 0}
                      className="px-2 py-0.5 rounded hover:bg-app-surface disabled:opacity-30 font-bold"
                    >
                      ←
                    </button>
                    <span className="font-mono text-[11px]">
                      Slide {carouselSlideIndex + 1} of {carouselTemplate.pages.length}
                    </span>
                    <button
                      onClick={() =>
                        setCarouselSlideIndex((prev) =>
                          Math.min(carouselTemplate.pages.length - 1, prev + 1)
                        )
                      }
                      disabled={carouselSlideIndex === carouselTemplate.pages.length - 1}
                      className="px-2 py-0.5 rounded hover:bg-app-surface disabled:opacity-30 font-bold"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>

              {/* Centered Canvas Container */}
              <div className="flex justify-center bg-app-subtle/30 border border-app-border/80 rounded-lg p-6 overflow-hidden">
                {formatOutput.format_kind === "card" && cardTemplate && (
                  <RenderInBrowser
                    template={cardTemplate}
                    pageIndex={0}
                    slotData={{
                      ...formatOutput.slots_data,
                      article_image:
                        (formatOutput.slots_data?.article_image as string) ||
                        article.in_article_images?.[0] ||
                        "",
                      in_article_images:
                        (formatOutput.slots_data?.in_article_images as string[]) ||
                        article.in_article_images ||
                        [],
                    }}
                    theme={brandTheme}
                    scale={0.42}
                  />
                )}

                {formatOutput.format_kind === "carousel" && carouselTemplate && (
                  <RenderInBrowser
                    template={carouselTemplate}
                    pageIndex={carouselSlideIndex}
                    slotData={{
                      ...formatOutput.slots_data,
                      article_image:
                        (formatOutput.slots_data?.article_image as string) ||
                        article.in_article_images?.[0] ||
                        "",
                      in_article_images:
                        (formatOutput.slots_data?.in_article_images as string[]) ||
                        article.in_article_images ||
                        [],
                    }}
                    theme={brandTheme}
                    scale={0.38}
                  />
                )}
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* Right Side: Grounding Provenance Inspector */}
        <div className="lg:col-span-5 sticky top-20">
          <GroundingProvenancePanel
            digestItems={digestItems}
            referencedItemIds={formatOutput.referenced_item_ids || []}
          />
        </div>
      </div>

      {/* Schedule Modal */}
      {isScheduleModalOpen && (
        <ScheduleModal
          articleId={article.id}
          articleTitle={article.title}
          currentFormatId={formatOutput.id}
          siblingFormats={siblingFormats.length > 0 ? siblingFormats : [formatOutput]}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}
    </div>
  );
}

