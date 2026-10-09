"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Select,
  Skeleton,
} from "@/components/admin/primitives";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { PaginationMeta } from "@/components/shared/PaginationMeta";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { ChevronRightIcon } from "@/components/admin/icons";
import * as adminApi from "@/lib/api/admin";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { formatDateTime } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import type { AuditLog, PaginatedResult, Role } from "@/types";

/* ----------------------------------------------------------------------
   /admin/audit-logs
   ----------------------------------------------------------------------
   URL-synced filters: ?page&limit&action&entityType. Metadata column
   is an expandable row that reveals the JSON payload pretty-printed.
   ---------------------------------------------------------------------- */

interface AuditFilters {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
}

const ACTION_OPTIONS = [
  "USER_ROLE_CHANGED",
  "USER_STATUS_CHANGED",
  "BLOOD_REQUEST_CREATED",
  "BLOOD_REQUEST_VERIFIED",
  "BLOOD_REQUEST_CANCELLED",
  "DONOR_ASSIGNED",
  "ASSIGNMENT_ACCEPTED",
  "ASSIGNMENT_REJECTED",
  "DONATION_COMPLETED",
  "PAYMENT_INITIATED",
  "PAYMENT_COMPLETED",
];

const ENTITY_OPTIONS = [
  "User",
  "BloodRequest",
  "Assignment",
  "Donation",
  "Payment",
];

export default function AdminAuditLogsPage() {
  const { searchParams, update, remove } = useUpdateSearchParams();

  const filters = useMemo<AuditFilters>(() => {
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");
    return {
      page: Number(searchParams.get("page") ?? 1) || 1,
      limit: Number(searchParams.get("limit") ?? 10) || 10,
      action: action ?? undefined,
      entityType: entityType ?? undefined,
    };
  }, [searchParams]);

  const query = useQuery<PaginatedResult<AuditLog>, Error>({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () =>
      adminApi.listAuditLogs({
        page: filters.page,
        limit: filters.limit,
        action: filters.action,
        entityType: filters.entityType,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const columns = useMemo<DataTableColumn<AuditLog>[]>(
    () => [
      {
        accessor: "createdAt",
        header: "Timestamp",
        cell: (row) => (
          <span
            className="text-xs text-muted-foreground"
            title={formatDateTime(row.createdAt)}
          >
            {formatDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        accessor: "actorId",
        header: "Actor",
        cell: (row) => {
          const role = row.actor?.role as Role | undefined;
          return (
            <div>
              <p className="text-sm font-semibold text-foreground">
                {row.actor?.name ?? "System"}
              </p>
              {role ? (
                <Badge
                  variant={
                    role === "ADMIN"
                      ? "destructive"
                      : role === "DONOR"
                      ? "info"
                      : "primary"
                  }
                >
                  {ROLE_LABELS[role]}
                </Badge>
              ) : null}
            </div>
          );
        },
      },
      {
        accessor: "action",
        header: "Action",
        cell: (row) => (
          <Badge variant="default" className="font-mono text-[11px]">
            {row.action}
          </Badge>
        ),
      },
      {
        accessor: "entityType",
        header: "Entity",
        cell: (row) => (
          <div className="text-xs">
            <p className="font-medium text-foreground">{row.entityType}</p>
            <p className="font-mono text-muted-foreground">
              #{row.entityId.slice(0, 8)}…
            </p>
          </div>
        ),
      },
      {
        accessor: "id",
        header: "Metadata",
        sortable: false,
        cell: (row) => {
          const isOpen = expanded[row.id] ?? false;
          const hasMetadata = row.metadata && Object.keys(row.metadata).length > 0;
          if (!hasMetadata) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div>
              <button
                type="button"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [row.id]: !isOpen }))
                }
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ChevronRightIcon
                  size={12}
                  className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
                />
                {isOpen ? "Hide" : "Show"}
              </button>
              {isOpen ? (
                <pre className="mt-2 max-w-md overflow-x-auto rounded-md bg-muted/40 p-2 text-[11px] leading-relaxed text-foreground">
                  {JSON.stringify(row.metadata, null, 2)}
                </pre>
              ) : null}
            </div>
          );
        },
      },
    ],
    [expanded],
  );

  const hasFilters = Boolean(filters.action) || Boolean(filters.entityType);
  const logs = query.data?.result ?? [];
  const meta = query.data?.meta;

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Every critical action, recorded"
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={filters.action ?? "ALL"}
            onChange={(event) =>
              update({
                action: event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "ALL", label: "All actions" },
              ...ACTION_OPTIONS.map((a) => ({ value: a, label: a })),
            ]}
            aria-label="Action filter"
          />
          <Select
            value={filters.entityType ?? "ALL"}
            onChange={(event) =>
              update({
                entityType:
                  event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "ALL", label: "All entity types" },
              ...ENTITY_OPTIONS.map((e) => ({ value: e, label: e })),
            ]}
            aria-label="Entity type filter"
          />
          <div className="flex items-center lg:col-span-2 lg:justify-end">
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => remove(["action", "entityType", "page", "limit"])}
              >
                Clear filters
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                Filter by action or entity type
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {query.isError ? (
        <EmptyState
          title="Failed to load audit logs"
          description={query.error?.message ?? "Please try again."}
          action={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      ) : query.isLoading && !query.data ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <>
          <PaginationMeta meta={meta} resource="audit entries" />
          <DataTable
            columns={columns}
            data={logs}
            isLoading={false}
            rowKey={(row) => row.id}
            emptyState={
              <EmptyState
                className="border-0"
                title="No audit entries"
                description="No actions match the current filters."
              />
            }
          />
          {meta && meta.total > 0 ? (
            <Pagination total={meta.total} totalPages={meta.totalPages} />
          ) : null}
        </>
      )}
    </PageContainer>
  );
}
