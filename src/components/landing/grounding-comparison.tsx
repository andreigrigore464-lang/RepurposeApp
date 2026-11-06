/**
 * Grounded vs Hallucinated Comparison Component
 * Visual comparison demonstrating factual grounding fidelity versus standard generative hallucinations.
 * System Layer: ui / landing
 */

import React from "react";

export function GroundingComparison(): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {/* Ungrounded Generative AI Card */}
      <div className="rounded-xl border border-red-200 bg-red-50/20 p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 text-red-800 text-[10px] font-semibold px-2.5 py-0.5 uppercase tracking-wider">
              ✕ Generic Generative AI
            </span>
            <span className="text-[11px] font-mono text-red-600 font-medium">Unverifiable</span>
          </div>

          <p className="font-serif text-sm font-semibold text-zinc-900 mb-3">
            &ldquo;In modern Europe, 94% of professionals now split bar tabs evenly to promote inclusivity, radically disrupting ancient hospitality norms.&rdquo;
          </p>

          <div className="space-y-2 mt-4 text-xs text-red-900/80 bg-red-100/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-bold">⚠</span>
              <span><strong>Hallucinated stat:</strong> The 94% figure does not exist in the source text.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-bold">⚠</span>
              <span><strong>Opposite meaning:</strong> The article explicitly states Germans do <em>not</em> split tabs evenly.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-red-600 font-bold">⚠</span>
              <span><strong>Zero provenance:</strong> No sentence references provided.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-red-200/60 text-[11px] text-red-700 font-medium">
          High brand risk • Factual liability • Editorial rejection
        </div>
      </div>

      {/* Repurpose Grounded Engine Card */}
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/25 p-6 flex flex-col justify-between shadow-xs">
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2.5 py-0.5 uppercase tracking-wider">
              ✓ Grounded Repurposing
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-medium">100% Provenance</span>
          </div>

          <p className="font-serif text-sm font-semibold text-zinc-900 mb-3">
            &ldquo;In Germany, keeping the bill item-by-item is seen as protecting friendships under the maxim: &lsquo;Klare Rechnung, gute Freunde&rsquo;.&rdquo;
          </p>

          <div className="space-y-2 mt-4 text-xs text-emerald-950 bg-emerald-100/60 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Verbatim grounding:</strong> Direct match from article sentence 8.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Exact quote:</strong> Preserves authentic German cultural idiom accurately.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">✓</span>
              <span><strong>Atomic ID tag:</strong> Cross-referenced with #item_5 in the review workbench.</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-medium">
          Zero hallucination • Auditable claims • Ready for publishing
        </div>
      </div>
    </div>
  );
}

