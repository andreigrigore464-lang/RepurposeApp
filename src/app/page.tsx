/**
 * Public Editorial Landing Page
 * Explains the anti-hallucination repurposing engine and captures publisher waitlist leads.
 * System Layer: ui / landing
 */

import Link from "next/link";
import { WaitlistForm } from "@/components/landing/waitlist-form";
import { GroundingComparison } from "@/components/landing/grounding-comparison";

export default function LandingPage() {
  return (
    <div className="space-y-24 py-6">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-medium text-app-ink">
            Strictly Grounded Repurposing for Digital Publishers
          </span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-app-ink leading-[1.15]">
          Turn long-form journalism into social content.{" "}
          <span className="italic text-app-accent">Without hallucination.</span>
        </h1>

        <p className="text-sm sm:text-base text-app-muted max-w-2xl mx-auto leading-relaxed">
          Generic AI tools invent statistics, fabricate quotes, and destroy editorial credibility.
          Repurpose extracts 100% verbatim facts, adapts them to platform rules, and displays source provenance next to every post.
        </p>

        {/* Waitlist Form */}
        <div className="pt-4">
          <WaitlistForm />
        </div>

        {/* Live Demo Link */}
        <div className="pt-2">
          <Link
            href="/inbox"
            className="text-xs font-medium text-app-accent hover:underline inline-flex items-center gap-1"
          >
            <span>Explore the Live Editorial Workbench</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* Comparison Section: Grounded vs Hallucinated */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-app-ink">
            The Cost of Unverified Generative AI
          </h2>
          <p className="text-xs sm:text-sm text-app-muted max-w-xl mx-auto">
            Why leading publications refuse to use standard generative chatbots for social distribution.
          </p>
        </div>

        <GroundingComparison />
      </section>

      {/* Platform & Format Matrix Section */}
      <section className="space-y-8 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-app-ink">
            One Article. Four Formats. Five Platforms.
          </h2>
          <p className="text-xs sm:text-sm text-app-muted max-w-xl mx-auto">
            Every format is synthesized strictly from extracted digest items, validated against Zod schemas, and adapted to native character constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-sky-700 bg-sky-50 border border-sky-200 inline-block px-2 py-0.5 rounded font-semibold uppercase mb-3">
                Text Post
              </div>
              <h3 className="font-serif font-bold text-base text-app-ink mb-1.5">
                Thought-Leadership Posts
              </h3>
              <p className="text-xs text-app-muted leading-relaxed">
                Hooks, core arguments, and discussion CTAs adapted with strict character limits and fold warnings.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-app-border/80 text-[11px] font-mono text-app-faint">
              LinkedIn • X • Instagram • Facebook • Threads
            </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 inline-block px-2 py-0.5 rounded font-semibold uppercase mb-3">
                Thread
              </div>
              <h3 className="font-serif font-bold text-base text-app-ink mb-1.5">
                Multi-Post Breakdowns
              </h3>
              <p className="text-xs text-app-muted leading-relaxed">
                Step-by-step sequential narratives with numbered posts, quote highlights, and closing references.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-app-border/80 text-[11px] font-mono text-app-faint">
              X (Twitter) • Threads
            </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 inline-block px-2 py-0.5 rounded font-semibold uppercase mb-3">
                Graphic Card
              </div>
              <h3 className="font-serif font-bold text-base text-app-ink mb-1.5">
                1080×1080 Square Visuals
              </h3>
              <p className="text-xs text-app-muted leading-relaxed">
                High-contrast typographic cards featuring kickers, bold headlines, and stat callouts in your brand kit.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-app-border/80 text-[11px] font-mono text-app-faint">
              LinkedIn • X • Instagram • Facebook
            </div>
          </div>

          <div className="bg-app-surface border border-app-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-purple-700 bg-purple-50 border border-purple-200 inline-block px-2 py-0.5 rounded font-semibold uppercase mb-3">
                Carousel
              </div>
              <h3 className="font-serif font-bold text-base text-app-ink mb-1.5">
                Multi-Page Document Decks
              </h3>
              <p className="text-xs text-app-muted leading-relaxed">
                Swipeable 4:5 portrait slide decks compiled directly to downloadable multi-page PDFs and PNG sequences.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-app-border/80 text-[11px] font-mono text-app-faint">
              LinkedIn (PDF) • Instagram (PNGs)
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-app-ink">
            The Editorial Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-app-muted max-w-lg mx-auto">
            A deterministic content assembly line designed specifically for rigorous publishing workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-app-muted">01 / INGEST</span>
            <h4 className="font-semibold text-sm text-app-ink">RSS or URL Ingest</h4>
            <p className="text-xs text-app-muted leading-relaxed">
              Monitors publication RSS feeds or ingests article URLs directly with SHA-256 deduplication and in-article image caching.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-app-muted">02 / GROUND</span>
            <h4 className="font-semibold text-sm text-app-ink">Grounded Digest</h4>
            <p className="text-xs text-app-muted leading-relaxed">
              Extracts atomic claims strictly paired with verbatim source sentences. Every output is validated against Zod schemas.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-app-muted">03 / SYNTHESIZE</span>
            <h4 className="font-semibold text-sm text-app-ink">Matrix Adapters</h4>
            <p className="text-xs text-app-muted leading-relaxed">
              Synthesizes formats from digest items and adapts them across platform character limits and packaging rules.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-app-muted">04 / REVIEW</span>
            <h4 className="font-semibold text-sm text-app-ink">Provenance Workbench</h4>
            <p className="text-xs text-app-muted leading-relaxed">
              Editors review posts with source sentences side-by-side, preview live canvas renders, and export with a single click.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-app-surface border border-app-border rounded-2xl p-8 sm:p-12 text-center space-y-6 max-w-3xl mx-auto shadow-sm">
        <h2 className="font-serif text-3xl font-bold text-app-ink">
          Protect Your Editorial Reputation
        </h2>
        <p className="text-xs sm:text-sm text-app-muted max-w-lg mx-auto leading-relaxed">
          Scale multi-platform reach while keeping every quote, number, and claim 100% faithful to the original reporting.
        </p>
        <div className="pt-2">
          <WaitlistForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-app-border pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between text-xs text-app-muted gap-4">
        <div>
          <span className="font-serif font-bold text-app-ink">Repurpose</span> — Calm Editorial SaaS
        </div>
        <div className="flex items-center gap-6">
          <Link href="/inbox" className="hover:text-app-ink transition-colors">
            Drafts Inbox
          </Link>
          <Link href="/feeds" className="hover:text-app-ink transition-colors">
            Content Feeds
          </Link>
          <Link href="/brand" className="hover:text-app-ink transition-colors">
            Brand Kit
          </Link>
        </div>
      </footer>
    </div>
  );
}
