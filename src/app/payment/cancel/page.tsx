import { Suspense } from "react";
import type { Metadata } from "next";

import PaymentCancelContent from "./PaymentCancelContent";


export const metadata: Metadata = {
  title: "Payment Cancelled",
  description: "Your payment was cancelled. No charges have been made.",
  robots: { index: false, follow: false },
};

function PaymentCancelFallback() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-6 h-8 w-56 animate-pulse rounded bg-muted" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<PaymentCancelFallback />}>
      <PaymentCancelContent />
    </Suspense>
  );
}
