"use client";

import { useMemo } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Skeleton,
} from "@/components/admin/primitives";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import * as donorsApi from "@/lib/api/donors";
import { toApiError } from "@/lib/api/_errors";
import { BLOOD_GROUP_LABELS } from "@/lib/constants";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { formatDateTime, formatRelativeTime } from "@/lib/utils";
import { DropletIcon } from "@/components/donor/icons";
import type { BloodGroup, DonationHistory, PaginatedResult } from "@/types";



export default function DonorHistoryPage() {
  const { searchParams } = useUpdateSearchParams();

  const page = Number(searchParams.get("page") ?? 1) || 1;
  const limit = Number(searchParams.get("limit") ?? 10) || 10;

  const query = useQuery<PaginatedResult<DonationHistory>, Error>({
    queryKey: ["donors", "donation-history", { page, limit }],
    queryFn: () => donorsApi.getDonationHistory({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const all = query.data?.result ?? [];
  const stats = useMemo(() => computeStats(all), [all]);

  const columns: DataTableColumn<DonationHistory>[] = [
    {
      accessor: "donationDate",
      header: "Date",
      cell: (row) => (
        <span
          className="text-sm text-foreground"
          title={formatDateTime(row.donationDate)}
        >
          {formatRelativeTime(row.donationDate)}
        </span>
      ),
    },
    {
      accessor: "id",
      header: "Blood group",
      cell: (row) =>
        row.bloodRequest ? (
          <Badge variant="primary">
            {BLOOD_GROUP_LABELS[row.bloodRequest.bloodGroup as BloodGroup]}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessor: "id",
      header: "Units",
      cell: (row) => (
        <span className="text-sm font-medium text-foreground">
          {row.units ?? 1}
        </span>
      ),
    },
    {
      accessor: "id",
      header: "Hospital / Location",
      cell: (row) => (
        <div>
          <p className="text-sm text-foreground">
            {row.bloodRequest?.hospitalName ?? "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.bloodRequest?.location ?? "—"}
          </p>
        </div>
      ),
    },
    {
      accessor: "id",
      header: "Status",
      cell: () => <Badge variant="success">Completed</Badge>,
    },
    {
      accessor: "id",
      header: "Notes",
      cell: (row) =>
        row.certificateUrl ? (
          <a
            href={row.certificateUrl}
            className="text-xs text-primary hover:underline"
          >
            Certificate
          </a>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Donation History"
        description="Your lifetime donations"
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {query.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              label="Total donations"
              value={stats.total}
              description="Completed cases"
              tone="primary"
            />
            <StatCard
              label="Units donated"
              value={stats.units}
              description="Across all donations"
              tone="info"
            />
            <StatCard
              label="Last donation"
              value={stats.lastRelative}
              description={stats.lastAbsolute}
              tone="success"
            />
          </>
        )}
      </section>

      {query.isError ? (
        <EmptyState
          title="Failed to load history"
          description={toApiError(query.error).message}
          action={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      ) : query.isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : all.length === 0 ? (
        <EmptyState
          icon={<DropletIcon size={22} />}
          title="No donations yet"
          description="Your first donation will appear here after an assignment is completed."
          action={
            <Link
              href="/donor/requests"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              View compatible requests
            </Link>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={all}
            isLoading={false}
            rowKey={(row) => row.id}
            emptyState={
              <EmptyState
                className="border-0"
                title="No donations"
                description="No completed donations match the current filters."
              />
            }
          />
          <Pagination
            total={query.data?.meta.total ?? 0}
            totalPages={query.data?.meta.totalPages ?? 1}
          />
        </>
      )}
    </PageContainer>
  );
}

function computeStats(rows: DonationHistory[]) {
  if (rows.length === 0) {
    return {
      total: 0,
      units: 0,
      lastRelative: "—",
      lastAbsolute: "No donations yet",
    };
  }
  const total = rows.length;
  const units = rows.reduce((sum, row) => sum + (row.units ?? 1), 0);
  const last = rows[0]!;
  return {
    total,
    units,
    lastRelative: formatRelativeTime(last.donationDate),
    lastAbsolute: formatDateTime(last.donationDate),
  };
}
