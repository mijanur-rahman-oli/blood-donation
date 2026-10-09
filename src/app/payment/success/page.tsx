import { Suspense } from "react";
import type { Metadata } from "next";

import PaymentSuccessContent from "./PaymentSuccessContent";

/* ----------------------------------------------------------------------
   /payment/success — Server wrapper
   ----------------------------------------------------------------------
   `useSearchParams()` requires a Suspense boundary in Next 15+, so the
   client content is split out and rendered here. Exports metadata so
   this page is indexable.
   ---------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Your blood-request verification fee was received.",
  robots: { index: false, follow: false },
};

function PaymentSuccessFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-6 h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded bg-muted" />
      <span className="sr-only">Loading payment confirmation…</span>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
