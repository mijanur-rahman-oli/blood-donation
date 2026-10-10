"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

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
  Select,
  Skeleton,
} from "@/components/admin/primitives";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { PaginationMeta } from "@/components/shared/PaginationMeta";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoreHorizontalIcon } from "@/components/admin/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/primitives";
import * as adminApi from "@/lib/api/admin";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import { extractApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
} from "@/lib/constants";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { formatDate } from "@/lib/utils";
import { toast } from "@/app/providers";
import type {
  BloodGroup,
  BloodRequest,
  DonorSearchResult,
  PaginatedResult,
  Priority,
  RequestStatus,
} from "@/types";

/* ----------------------------------------------------------------------
   /admin/requests — Blood request admin
   ----------------------------------------------------------------------
   URL-synced filters. Mutations: verify + assignDonor, both invalidate
   the relevant keys. Verify has an optimistic update.
   ---------------------------------------------------------------------- */

interface RequestsFilters {
  page: number;
  limit: number;
  status?: RequestStatus;
  priority?: Priority;
  bloodGroup?: BloodGroup;
  q?: string;
}

export default function AdminRequestsPage() {
  const { searchParams, update, remove } = useUpdateSearchParams();

  const filters = useMemo<RequestsFilters>(() => {
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const bloodGroup = searchParams.get("bloodGroup");
    const q = searchParams.get("q");
    return {
      page: Number(searchParams.get("page") ?? 1) || 1,
      limit: Number(searchParams.get("limit") ?? 10) || 10,
      status: isStatus(status) ? status : undefined,
      priority: isPriority(priority) ? priority : undefined,
      bloodGroup: isBloodGroup(bloodGroup) ? bloodGroup : undefined,
      q: q ?? undefined,
    };
  }, [searchParams]);

  const query = useQuery<PaginatedResult<BloodRequest>, Error>({
    queryKey: ["admin", "blood-requests", filters],
    queryFn: () =>
      adminApi.listAllBloodRequests({
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        priority: filters.priority,
        bloodGroup: filters.bloodGroup,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: (id: string) => bloodRequestsApi.verify(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["admin", "blood-requests", filters],
      });
      const previous = queryClient.getQueryData<
        PaginatedResult<BloodRequest> | undefined
      >(["admin", "blood-requests", filters]);
      if (previous) {
        queryClient.setQueryData<PaginatedResult<BloodRequest>>(
          ["admin", "blood-requests", filters],
          {
            ...previous,
            result: previous.result.map((r) =>
              r.id === id
                ? {
                    ...r,
                    status: "VERIFIED",
                    verifiedAt: new Date().toISOString(),
                  }
                : r,
            ),
          },
        );
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success(
        "Request verified",
        "The request is now visible to donors.",
      );
      void queryClient.invalidateQueries({
        queryKey: ["admin", "blood-requests"],
      });
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["admin", "blood-requests", filters],
          context.previous,
        );
      }
      toast.error("Failed to verify", extractApiError(error));
    },
  });

  const [matchesOpen, setMatchesOpen] = useState(false);
  const [matchesTarget, setMatchesTarget] = useState<BloodRequest | null>(null);

  function openMatches(request: BloodRequest) {
    setMatchesTarget(request);
    setMatchesOpen(true);
  }

  const columns = useMemo<DataTableColumn<BloodRequest>[]>(
    () => [
      {
        accessor: "patientName",
        header: "Patient",
        cell: (row) => (
          <div>
            <p className="text-sm font-semibold text-foreground">
              {row.patientName}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.hospitalName} · {row.location}
            </p>
          </div>
        ),
      },
      {
        accessor: "bloodGroup",
        header: "Blood",
        cell: (row) => (
          <Badge variant="primary">{BLOOD_GROUP_LABELS[row.bloodGroup]}</Badge>
        ),
      },
      {
        accessor: "unitsNeeded",
        header: "Units",
        cell: (row) => (
          <span className="text-sm font-medium text-foreground">
            {row.unitsNeeded}
          </span>
        ),
      },
      {
        accessor: "location",
        header: "Location",
        cell: (row) => (
          <span className="text-sm text-muted-foreground">{row.location}</span>
        ),
      },
      {
        accessor: "priority",
        header: "Priority",
        cell: (row) => (
          <Badge variant={priorityBadgeVariant(row.priority)}>
            {PRIORITY_LABELS[row.priority]}
          </Badge>
        ),
      },
      {
        accessor: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        accessor: "createdAt",
        header: "Created",
        cell: (row) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        accessor: "id",
        header: "Actions",
        sortable: false,
        align: "right",
        cell: (row) => (
          <RowActions
            request={row}
            onVerify={() => verifyMutation.mutate(row.id)}
            onFindMatches={() => openMatches(row)}
            verifyPending={
              verifyMutation.isPending && verifyMutation.variables === row.id
            }
          />
        ),
      },
    ],
    [verifyMutation],
  );

  const hasFilters =
    Boolean(filters.status) ||
    Boolean(filters.priority) ||
    Boolean(filters.bloodGroup) ||
    Boolean(filters.q);
  const requests = query.data?.result ?? [];
  const meta = query.data?.meta;

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Blood Requests"
        description="Verify and assign donors"
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <SearchInput placeholder="Search by patient, hospital…" />
          <Select
            value={filters.status ?? "ALL"}
            onChange={(event) =>
              update({
                status: event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "ALL", label: "All statuses" },
              ...REQUEST_STATUSES.map((s) => ({
                value: s,
                label: REQUEST_STATUS_LABELS[s],
              })),
            ]}
            aria-label="Status filter"
          />
          <Select
            value={filters.priority ?? "ALL"}
            onChange={(event) =>
              update({
                priority:
                  event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "ALL", label: "All priorities" },
              ...PRIORITIES.map((p) => ({
                value: p,
                label: PRIORITY_LABELS[p],
              })),
            ]}
            aria-label="Priority filter"
          />
          <Select
            value={filters.bloodGroup ?? "ALL"}
            onChange={(event) =>
              update({
                bloodGroup:
                  event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "ALL", label: "All blood groups" },
              ...BLOOD_GROUPS.map((g) => ({
                value: g,
                label: BLOOD_GROUP_LABELS[g],
              })),
            ]}
            aria-label="Blood group filter"
          />
          <div className="flex items-center justify-end">
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() =>
                  remove([
                    "q",
                    "status",
                    "priority",
                    "bloodGroup",
                    "page",
                    "limit",
                  ])
                }
              >
                Clear filters
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">
                No filters applied
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {query.isError ? (
        <EmptyState
          title="Failed to load requests"
          description={query.error?.message ?? "Please try again."}
          action={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      ) : (
        <>
          <PaginationMeta meta={meta} resource="requests" />
          <DataTable
            columns={columns}
            data={requests}
            isLoading={query.isLoading && !query.data}
            rowKey={(row) => row.id}
            emptyState={
              <EmptyState
                className="border-0"
                title="No requests found"
                description={
                  hasFilters
                    ? "Try removing some filters."
                    : "Requests will appear here as they come in."
                }
              />
            }
          />
          {meta && meta.total > 0 ? (
            <Pagination total={meta.total} totalPages={meta.totalPages} />
          ) : null}
        </>
      )}

      <FindMatchesDialog
        request={matchesTarget}
        open={matchesOpen}
        onOpenChange={setMatchesOpen}
        onAssigned={() => {
          setMatchesOpen(false);
          void queryClient.invalidateQueries({
            queryKey: ["admin", "blood-requests"],
          });
        }}
      />
    </PageContainer>
  );
}

/* ----------------------------------------------------------------------
   Row actions
   ---------------------------------------------------------------------- */
function RowActions({
  request,
  onVerify,
  onFindMatches,
  verifyPending,
}: {
  request: BloodRequest;
  onVerify: () => void;
  onFindMatches: () => void;
  verifyPending: boolean;
}) {
  const canVerify = request.status === "PENDING";
  const canMatch = request.status === "VERIFIED" || request.status === "MATCHING";
  return (
    <div
      className="flex justify-end"
      onClick={(event) => event.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Open request actions"
        >
          <MoreHorizontalIcon size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <Link
            href={`/dashboard/requests/${request.id}`}
            className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
          >
            View details
          </Link>
          {canVerify ? (
            <DropdownMenuItem onClick={onVerify} disabled={verifyPending}>
              {verifyPending ? "Verifying…" : "Verify"}
            </DropdownMenuItem>
          ) : null}
          {canMatch ? (
            <DropdownMenuItem onClick={onFindMatches}>
              Find matches
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Find Matches dialog
   ---------------------------------------------------------------------- */
function FindMatchesDialog({
  request,
  open,
  onOpenChange,
  onAssigned,
}: {
  request: BloodRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}) {
  const queryClient = useQueryClient();

  const matchesQuery = useQuery<PaginatedResult<DonorSearchResult>, Error>({
    queryKey: ["blood-requests", request?.id, "matches"],
    queryFn: () => {
      if (!request) throw new Error("No request selected");
      return bloodRequestsApi.getMatches(request.id);
    },
    enabled: Boolean(request) && open,
    staleTime: 30_000,
  });

  const assignMutation = useMutation({
    mutationFn: (input: { id: string; donorId: string }) =>
      bloodRequestsApi.assignDonor(input.id, { donorId: input.donorId }),
    onSuccess: () => {
      toast.success("Donor assigned", "The case is now ASSIGNED.");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "blood-requests"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["blood-requests", request?.id, "matches"],
      });
      onAssigned();
    },
    onError: (error) => {
      toast.error("Failed to assign", extractApiError(error));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Compatible Donors
            {request ? ` for ${request.patientName}` : ""}
          </DialogTitle>
          <DialogDescription>
            {request
              ? `${BLOOD_GROUP_LABELS[request.bloodGroup]} · ${request.unitsNeeded} unit${request.unitsNeeded === 1 ? "" : "s"} needed · ${request.location}`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-5">
          {matchesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-border p-3"
                >
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : matchesQuery.isError ? (
            <p className="text-sm text-destructive">
              {matchesQuery.error?.message ?? "Failed to load matches."}
            </p>
          ) : !matchesQuery.data || matchesQuery.data.result.length === 0 ? (
            <EmptyState
              title="No compatible donors available"
              description="Try expanding the search radius or wait for new donors to register."
            />
          ) : (
            <ul className="space-y-2">
              {matchesQuery.data.result.map((donor) => {
                const isPending =
                  assignMutation.isPending &&
                  assignMutation.variables?.donorId === donor.profileId;
                return (
                  <li
                    key={donor.profileId}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                      >
                        {initials(donor.name)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {donor.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {donor.location} ·{" "}
                          {donor.lastDonationDate
                            ? `last donated ${formatDate(donor.lastDonationDate)}`
                            : "no prior donations"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">
                        {BLOOD_GROUP_LABELS[donor.bloodGroup]}
                      </Badge>
                      <Badge variant={donor.availability ? "success" : "default"}>
                        {donor.availability ? "Available" : "Unavailable"}
                      </Badge>
                      <Button
                        size="sm"
                        disabled={!donor.availability || isPending}
                        onClick={() =>
                          request &&
                          assignMutation.mutate({
                            id: request.id,
                            donorId: donor.profileId,
                          })
                        }
                      >
                        {isPending ? "Assigning…" : "Assign"}
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------------- */
function priorityBadgeVariant(
  priority: Priority,
): "destructive" | "warning" | "info" | "default" {
  switch (priority) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "info";
    case "LOW":
    default:
      return "default";
  }
}

function initials(name: string): string {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function isStatus(value: string | null): value is RequestStatus {
  return value !== null && (REQUEST_STATUSES as readonly string[]).includes(value);
}
function isPriority(value: string | null): value is Priority {
  return value !== null && (PRIORITIES as readonly string[]).includes(value);
}
function isBloodGroup(value: string | null): value is BloodGroup {
  return value !== null && (BLOOD_GROUPS as readonly string[]).includes(value);
}
