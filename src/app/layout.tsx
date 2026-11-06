/**
 * Root Application Layout
 * Sets HTML document metadata, viewport settings, and global typography.
 * Serves as the outer frame for the calm editorial workbench interface.
 */

import type { Metadata } from "next";
import "./globals.css";
import { NavHeader } from "../components/layout/nav-header";

export const metadata: Metadata = {
  title: "Repurpose — Editorial SaaS",
  description: "Transform long-form articles into grounded, platform-ready social content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        suppressHydrationWarning 
        className="min-h-screen bg-app-bg text-app-ink antialiased"
      >
        <NavHeader />
        <main className="mx-auto max-w-7xl px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

