"use client";

/**
 * Grounding Provenance Inspector Component
 * Displays verbatim source sentences and extracted claims for fact cross-referencing.
 * System Layer: ui / review
 */

import React, { useState } from "react";
import { DigestItem } from "@/pipeline/2-digest/digest-schema";

interface GroundingProvenancePanelProps {
  digestItems: DigestItem[];
  referencedItemIds: string[];
}

export function GroundingProvenancePanel({
  digestItems,
  referencedItemIds,
}: GroundingProvenancePanelProps): React.JSX.Element {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyQuote = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getKindBadgeStyle = (kind: string) => {
    switch (kind) {
      case "statistic":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "quote":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "key_takeaway":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "step":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  // Sort referenced items first
  const sortedItems = [...digestItems].sort((a, b) => {
    const aRef = referencedItemIds.includes(a.id);
    const bRef = referencedItemIds.includes(b.id);
    if (aRef && !bRef) return -1;
    if (!aRef && bRef) return 1;
    return 0;
  });

  return (
    <div className="bg-app-surface border border-app-border rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-app-border bg-app-subtle/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <h3 className="text-xs font-semibold text-app-ink uppercase tracking-wider">
            Grounding Provenance
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
          100% Verbatim Source
        </span>
      </div>

      <div className="p-4 overflow-y-auto space-y-4 max-h-[calc(100vh-220px)]">
        <p className="text-[11px] text-app-muted leading-relaxed">
          Every statement in this draft is strictly derived from the extracted sentences below. Cross-reference claims to ensure factual fidelity.
        </p>

        {sortedItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-app-muted">
            No grounding items found for this article.
          </div>
        ) : (
          sortedItems.map((item) => {
            const isReferenced = referencedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`rounded-lg border p-3.5 transition-all ${
                  isReferenced
                    ? "border-emerald-300 bg-emerald-50/20 shadow-xs"
                    : "border-app-border bg-app-surface"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] font-semibold text-app-ink bg-app-subtle px-1.5 py-0.5 rounded">
                      #{item.id}
                    </span>
                    <span
                      className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${getKindBadgeStyle(
                        item.kind
                      )}`}
                    >
                      {item.kind.replace("_", " ")}
                    </span>
                    {isReferenced && (
                      <span className="text-[9px] font-medium text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        In Draft
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopyQuote(item.id, item.source_sentences.join(" "))}
                    className="text-[10px] text-app-muted hover:text-app-accent font-medium transition-colors"
                  >
                    {copiedId === item.id ? "Copied Quote" : "Copy Quote"}
                  </button>
                </div>

                {/* Claim Takeaway */}
                <div className="text-xs font-medium text-app-ink mb-2">
                  {item.text}
                </div>

                {/* Verbatim Source Sentences */}
                <div className="rounded-md border border-emerald-200/80 bg-emerald-50/40 p-2.5 text-[11px] font-serif italic text-emerald-950 leading-relaxed">
                  &ldquo;{item.source_sentences.join(" ")}&rdquo;
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
