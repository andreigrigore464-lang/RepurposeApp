"use client";

/**
 * Editorial Top Navigation Header
 * Provides calm, restrained navigation across Inbox, Feeds, and Brand Kit.
 * System Layer: ui / layout
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function NavHeader(): React.JSX.Element {
  const pathname = usePathname();
  const [dueTodayCount, setDueTodayCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    async function checkDueToday() {
      try {
        const res = await fetch("/api/calendar");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && typeof data.dueTodayCount === "number") {
            setDueTodayCount(data.dueTodayCount);
          }
        }
      } catch {
        // Silent background fallback
      }
    }
    checkDueToday();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const navItems = [
    { label: "Drafts Inbox", href: "/inbox" },
    { label: "Repurpose Studio", href: "/repurpose" },
    { label: "Workflow", href: "/feeds" },
    { label: "Templates", href: "/templates" },
    { label: "Calendar", href: "/calendar", badge: dueTodayCount },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-app-border bg-app-surface/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/inbox" className="flex items-center gap-2 group">
            <span className="font-serif text-lg font-bold tracking-tight text-app-ink group-hover:text-app-accent transition-colors">
              Repurpose
            </span>
            <span className="rounded bg-app-subtle px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-app-muted uppercase">
              Editorial MVP
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-app-subtle text-app-ink font-semibold"
                      : "text-app-muted hover:bg-app-subtle/60 hover:text-app-ink"
                  }`}
                >
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-app-border bg-app-subtle/50 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-app-ink">Editorial Workspace</span>
          </div>
        </div>
      </div>
    </header>
  );
}

