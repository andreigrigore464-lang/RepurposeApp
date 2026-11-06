"use client";

/**
 * Waitlist Submission Form Component
 * Minimal, high-contrast email capture with bot honeypot and inline feedback states.
 * System Layer: ui / landing
 */

import React, { useState } from "react";

export function WaitlistForm(): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, honeypot }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed.");
      }

      setSuccessMessage(data.message || "You're on the list!");
      setEmail("");
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-800 font-medium text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <p className="text-xs text-emerald-700/80 mt-1">
            We review early-access applications in weekly editorial cohorts.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Hidden honeypot field for bot deterrence */}
            <input
              type="text"
              name="hp_website"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <input
              type="email"
              required
              placeholder="editor@publication.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="flex-1 rounded-md border border-app-border bg-app-surface px-4 py-2.5 text-xs text-app-ink placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-accent shadow-xs"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-app-ink px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Joining..." : "Get Early Access"}
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-600 text-center">{errorMessage}</p>
          )}

          <p className="text-[11px] text-app-faint text-center">
            Zero spam. For digital editors, publishers, and content leads.
          </p>
        </form>
      )}
    </div>
  );
}

