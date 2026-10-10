"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@/components/admin/primitives";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { PaginationMeta } from "@/components/shared/PaginationMeta";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  CopyIcon,
  CreditCardIcon,
  EyeIcon,
} from "@/components/dashboard/icons";
import * as paymentsApi from "@/lib/api/payments";
import { PAYMENT_PURPOSE_LABELS, type PaymentPurpose } from "@/lib/constants";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils";
import { toast } from "@/app/providers";
import type { PaginatedResult, Payment } from "@/types";



export default function PaymentsPage() {
  const { searchParams } = useUpdateSearchParams();
  const page = Number(searchParams.get("page") ?? 1) || 1;
  const limit = Number(searchParams.get("limit") ?? 10) || 10;
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useQuery<PaginatedResult<Payment>, Error>({
    queryKey: ["payments", { page, limit }],
    queryFn: () => paymentsApi.list({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const opened = openId
    ? (query.data?.result ?? []).find((p) => p.id === openId) ?? null
    : null;

  const columns: DataTableColumn<Payment>[] = [
    {
      accessor: "createdAt",
      header: "Date",
      cell: (row) => (
        <span
          className="text-sm text-foreground"
          title={formatDateTime(row.createdAt)}
        >
          {formatRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      accessor: "id",
      header: "Payment ID",
      cell: (row) => (
        <button
          type="button"
          onClick={() => {
            if (typeof navigator !== "undefined" && navigator.clipboard) {
              void navigator.clipboard
                .writeText(row.id)
                .then(() =>
                  toast.success(
                    "Copied",
                    "Payment ID copied to clipboard.",
                  ),
                );
            }
          }}
          className="inline-flex items-center gap-1 rounded-sm font-mono text-xs text-muted-foreground hover:text-foreground"
          title="Click to copy"
        >
          {row.id.slice(0, 12)}…
          <CopyIcon size={12} />
        </button>
      ),
    },
    {
      accessor: "purpose",
      header: "Purpose",
      cell: (row) => (
        <Badge variant="default">
          {PAYMENT_PURPOSE_LABELS[row.purpose as PaymentPurpose]}
        </Badge>
      ),
    },
    {
      accessor: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="text-sm font-semibold text-foreground">
          {formatCurrency(row.amount, row.currency || "BDT")}
        </span>
      ),
    },
    {
      accessor: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      accessor: "id",
      header: "Actions",
      sortable: false,
      align: "right",
      cell: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpenId(row.id)}
        >
          <EyeIcon size={12} /> View
        </Button>
      ),
    },
  ];

  const payments = query.data?.result ?? [];
  const meta = query.data?.meta;

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Payment History"
        description="Your transaction records"
      />

      {query.isError ? (
        <EmptyState
          title="Failed to load payments"
          description={query.error?.message ?? "Please try again."}
          action={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      ) : query.isLoading && !query.data ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <EmptyState
          icon={<CreditCardIcon size={22} />}
          title="No payments yet"
          description="When you pay a verification fee it will show up here."
          action={
            <a
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
            >
              Back to dashboard
            </a>
          }
        />
      ) : (
        <>
          <PaginationMeta meta={meta} resource="payments" />
          <DataTable
            columns={columns}
            data={payments}
            isLoading={false}
            rowKey={(row) => row.id}
            emptyState={
              <EmptyState
                className="border-0"
                title="No payments"
                description="No transactions match the current filters."
              />
            }
          />
          {meta && meta.total > 0 ? (
            <Pagination total={meta.total} totalPages={meta.totalPages} />
          ) : null}
        </>
      )}

      <Dialog
        open={Boolean(openId)}
        onOpenChange={(o) => !o && setOpenId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment details</DialogTitle>
            <DialogDescription>
              {opened
                ? `Reference ${opened.id.slice(0, 12)}…`
                : "Loading…"}
            </DialogDescription>
          </DialogHeader>
          {opened ? (
            <div className="grid grid-cols-1 gap-3 p-5 text-sm sm:grid-cols-2">
              <DetailRow
                label="Date"
                value={formatDateTime(opened.createdAt)}
              />
              <DetailRow
                label="Status"
                value={<StatusBadge status={opened.status} />}
              />
              <DetailRow
                label="Purpose"
                value={
                  PAYMENT_PURPOSE_LABELS[opened.purpose as PaymentPurpose]
                }
              />
              <DetailRow
                label="Amount"
                value={formatCurrency(
                  opened.amount,
                  opened.currency || "BDT",
                )}
              />
              <DetailRow
                label="Transaction ID"
                value={
                  <span className="font-mono text-xs text-muted-foreground">
                    {opened.transactionId ?? "—"}
                  </span>
                }
              />
              <DetailRow
                label="Paid at"
                value={opened.paidAt ? formatDateTime(opened.paidAt) : "—"}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}
