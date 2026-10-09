"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/admin/primitives";

/* ----------------------------------------------------------------------
   GoBackButton
   ----------------------------------------------------------------------
   Tiny client component that calls `router.back()`. Imported by
   `not-found.tsx`, which is a Server Component, so the navigation
   handler has to be split out.
   ---------------------------------------------------------------------- */

export function GoBackButton() {
  const router = useRouter();
  return (
    <Button variant="outline" onClick={() => router.back()}>
      <svg
        className="mr-2 h-4 w-4"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      Go Back
    </Button>
  );
}
