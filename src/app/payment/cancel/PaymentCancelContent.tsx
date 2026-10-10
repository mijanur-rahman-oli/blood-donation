"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Card, CardContent } from "@/components/admin/primitives";
import { truncate } from "@/lib/utils";

/* ----------------------------------------------------------------------
   /payment/cancel — Client content
   ----------------------------------------------------------------------
   The backend payment controller redirects here with `?tran_id=BDEP_xxx`
   on cancel. We read BOTH `?paymentId=` (internal UUID, future-friendly)
   and `?tran_id=` (gateway transactionId, what the backend actually
   ships) and surface whichever the user can quote to support.
   ---------------------------------------------------------------------- */

export default function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId")?.trim() || null;
  const tranId =
    (searchParams.get("tran_id") ?? searchParams.get("tranId"))?.trim() ||
    null;
  const bloodRequestId = searchParams.get("bloodRequestId")?.trim() || null;

  const retryHref = bloodRequestId
    ? `/dashboard/requests/${bloodRequestId}`
    : "/dashboard";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-warning/15"
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
          className="text-warning"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-foreground">Payment Cancelled</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your payment was not completed. No charges have been made.
      </p>

      <Card className="mt-8 w-full text-left">
        <CardContent className="space-y-2 p-6 text-sm">
          <p>
            You can retry the payment from your request detail page. If you
            cancelled by mistake, no action is needed.
          </p>
          {paymentId || tranId ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              {paymentId ? (
                <p>
                  Reference:{" "}
                  <span className="font-mono">{truncate(paymentId, 16)}</span>
                </p>
              ) : null}
              {tranId ? (
                <p>
                  Transaction:{" "}
                  <span className="font-mono">{truncate(tranId, 24)}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={retryHref}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Try Again
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
