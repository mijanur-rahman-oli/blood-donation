import Link from "next/link";

import { GoBackButton } from "@/components/shared/GoBackButton";

/* ----------------------------------------------------------------------
   /not-found — 404
   ----------------------------------------------------------------------
   Server component. Only the "Go Back" button is client-side; everything
   else (the illustration, the copy, the home button) is static markup
   rendered on the server.
   ---------------------------------------------------------------------- */

export const metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mb-6 flex h-32 w-32 items-center justify-center" aria-hidden>
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
        >
          <path d="M60 14c-8 18-30 30-30 60a30 30 0 0 0 60 0c0-30-22-42-30-60Z" />
          <line x1="35" y1="55" x2="85" y2="100" />
          <line x1="85" y1="55" x2="35" y2="100" />
        </svg>
      </div>

      <h1 className="text-4xl font-bold text-foreground">404 — Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Back to Home
        </Link>
        <GoBackButton />
      </div>
    </div>
  );
}
