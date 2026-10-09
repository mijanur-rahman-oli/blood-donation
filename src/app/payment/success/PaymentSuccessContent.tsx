"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
} from "@/components/admin/primitives";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import * as paymentsApi from "@/lib/api/payments";
import { toApiError } from "@/lib/api/_errors";
import { formatCurrency, formatDateTime, truncate, cn } from "@/lib/utils";
import { PAYMENT_PURPOSE_LABELS } from "@/lib/constants";
import type { Payment, PaymentStatus } from "@/types";

/* ----------------------------------------------------------------------
   /payment/success — Payment success
   ----------------------------------------------------------------------
   Reads `?paymentId=` from the URL. Polls the backend every 2 seconds
   for up to 5 attempts to allow the IPN to reconcile, then stops.
   ---------------------------------------------------------------------- */

const POLL_INTERVAL_MS = 2_000;
const MAX_POLLS = 5;

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const rawId = searchParams.get("paymentId");
  const paymentId = rawId?.trim() ? rawId.trim() : null;

  const [pollCount, setPollCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const query = useQuery<Payment, Error>({
    queryKey: ["payments", paymentId ?? "missing"],
    queryFn: () => {
      if (!paymentId) {
        throw new Error("Payment ID missing");
      }
      return paymentsApi.getById(paymentId);
    },
    enabled: Boolean(paymentId),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return POLL_INTERVAL_MS;
      if (data.status === "PENDING" && pollCount < MAX_POLLS) {
        return POLL_INTERVAL_MS;
      }
      return false;
    },
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

  // Increment the poll counter on each successful fetch so the refetch
  // interval callback can stop after MAX_POLLS attempts.
  useEffect(() => {
    if (query.isSuccess) setPollCount((n) => n + 1);
  }, [query.isSuccess, query.dataUpdatedAt]);

  if (!paymentId) {
    return (
      <EmptyState
        title="Payment ID missing"
        description="We could not find the payment you were trying to confirm."
        action={
          <Link
            href="/dashboard/payments"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Back to payment history
          </Link>
        }
      />
    );
  }

  if (query.isLoading || query.isPending) {
    return <SuccessSkeleton />;
  }

  if (query.isError) {
    return (
      <EmptyState
        title="Could not load payment"
        description={toApiError(query.error).message}
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button onClick={() => query.refetch()}>Retry</Button>
            <Link
              href="/dashboard/payments"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Back to payment history
            </Link>
          </div>
        }
      />
    );
  }

  const payment = query.data;
  if (!payment) return <SuccessSkeleton />;

  const isReconciled = payment.status === "PAID";
  const isFailed = payment.status === "FAILED" || payment.status === "CANCELLED";

  if (isFailed) {
    return <FailedVariant payment={payment} />;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div
        className={cn(
          "mb-6 flex h-24 w-24 items-center justify-center rounded-full",
          isReconciled ? "bg-success/15" : "bg-warning/15",
        )}
        aria-hidden
      >
        {isReconciled ? (
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-success"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        ) : (
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-warning"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l3 2" />
          </svg>
        )}
      </div>

      <h1 className="text-3xl font-bold text-foreground">
        {isReconciled ? "Payment Successful!" : "Payment Pending"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isReconciled
          ? "Your verification fee has been received. Your request has been prioritized."
          : "We are still waiting for the payment gateway to confirm your transaction. This page will update automatically."}
      </p>

      <Card className="mt-8 w-full">
        <CardContent className="space-y-3 p-6 text-left">
          <Row label="Payment ID">
            <button
              type="button"
              onClick={async () => {
                try {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    await navigator.clipboard.writeText(payment.id);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1500);
                  }
                } catch {
                  // noop
                }
              }}
              className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
              title="Click to copy"
            >
              {truncate(payment.id, 16)}
              {copied ? (
                <span className="text-success">Copied</span>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </Row>
          <Row label="Amount">
            <span className="font-semibold text-foreground">
              {formatCurrency(payment.amount, payment.currency || "BDT")}
            </span>
          </Row>
          <Row label="Purpose">
            <span>
              {PAYMENT_PURPOSE_LABELS[payment.purpose] ?? payment.purpose}
            </span>
          </Row>
          <Row label="Status">
            <StatusBadge status={payment.status} />
            {!isReconciled ? (
              <Badge variant="warning" className="ml-2">
                Reconciling…
              </Badge>
            ) : null}
          </Row>
          <Row label="Paid at">{formatDateTime(payment.paidAt)}</Row>
          {payment.bloodRequestId ? (
            <Row label="Blood request">
              <Link
                href={`/dashboard/requests/${payment.bloodRequestId}`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View request →
              </Link>
            </Row>
          ) : null}
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Back to Dashboard
        </Link>
        <Link
          href="/dashboard/payments"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          View Payment History
        </Link>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Failed / cancelled variant
   ---------------------------------------------------------------------- */
function FailedVariant({ payment }: { payment: Payment }) {
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
      <h1 className="text-3xl font-bold text-foreground">
        Payment could not be confirmed
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We did not see a successful payment. If you believe this is an
        error, contact support with the reference below.
      </p>
      <Card className="mt-8 w-full">
        <CardContent className="space-y-2 p-6 text-left text-sm">
          <Row label="Reference">
            <span className="font-mono text-xs text-muted-foreground">
              {truncate(payment.id, 16)}
            </span>
          </Row>
          <Row label="Status">
            <StatusBadge status={payment.status} />
          </Row>
        </CardContent>
      </Card>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={
            payment.bloodRequestId
              ? `/dashboard/requests/${payment.bloodRequestId}`
              : "/dashboard"
          }
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          Try Again
        </Link>
        <Link
          href="/dashboard/payments"
          className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
        >
          View Payment History
        </Link>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Building blocks
   ---------------------------------------------------------------------- */
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{children}</span>
    </div>
  );
}

function SuccessSkeleton() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="mt-6 h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-80" />
      <Card className="mt-8 w-full">
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Skeleton className="mt-8 h-10 w-40" />
      <span className="sr-only">Loading payment confirmation…</span>
    </div>
  );
}

// Re-export for completeness — the badge variant accepts the union but
// the only PENDING-on-success path goes through `isReconciled`.
export type { PaymentStatus };
