"use client";

import Link from "next/link";
import { useEffect } from "react";


interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10"
        aria-hidden
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-destructive"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We hit an unexpected error. Please try again — if the problem
        persists, contact support.
      </p>

      <details className="mt-6 w-full max-w-md rounded-md border border-border bg-muted/30 p-3 text-left">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Technical details
        </summary>
        <div className="mt-2 space-y-1 text-xs">
          <p className="font-mono text-foreground break-words">
            {error.message}
          </p>
          {error.digest ? (
            <p className="font-mono text-[10px] text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>
      </details>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
