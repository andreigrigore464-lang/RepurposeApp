/**
 * 404 Not Found Page
 * App Router default error boundary for missing routes.
 */

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight text-app-ink mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-app-muted max-w-md mb-6">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/inbox"
        className="px-4 py-2 text-sm font-medium text-white bg-app-accent rounded-lg shadow-sm hover:opacity-90 transition-opacity"
      >
        Return to Inbox
      </Link>
    </div>
  );
}

