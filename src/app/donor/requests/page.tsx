"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Select,
  Skeleton,
} from "@/components/admin/primitives";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import * as donorsApi from "@/lib/api/donors";
import { toApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUP_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { formatRelativeTime, truncate } from "@/lib/utils";
import { DropletIcon, MapPinIcon } from "@/components/donor/icons";
import type { BloodGroup, BloodRequest, PaginatedResult, Priority } from "@/types";

/* ----------------------------------------------------------------------
   /donor/requests — Compatible requests
   ----------------------------------------------------------------------
   URL-synced ?page&limit&priority&sortBy. Grid is 1/2/3 columns by
   viewport. Each card summarizes a compatible blood request.
   ---------------------------------------------------------------------- */

export default function DonorRequestsPage() {
  const { searchParams, update, remove } = useUpdateSearchParams();

  const page = Number(searchParams.get("page") ?? 1) || 1;
  const limit = Number(searchParams.get("limit") ?? 9) || 9;
  const priorityParam = searchParams.get("priority");
  const sortByParam = searchParams.get("sortBy");

  const priority = isPriority(priorityParam) ? priorityParam : undefined;
  const sortBy: "priority" | "createdAt" =
    sortByParam === "priority" ? "priority" : "createdAt";
  const sortOrder: "asc" | "desc" = "desc";

  const filters = useMemo(
    () => ({ page, limit, priority, sortBy, sortOrder }),
    [page, limit, priority, sortBy, sortOrder],
  );

  const query = useQuery<PaginatedResult<BloodRequest>, Error>({
    queryKey: ["donors", "requests", filters],
    queryFn: () => donorsApi.getCompatibleRequests(filters),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const requests: BloodRequest[] = query.data?.result ?? [];
  const hasFilters =
    Boolean(filters.priority) || filters.sortBy !== "createdAt";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Compatible Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Blood requests matching your blood group
        </p>
      </header>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            value={filters.priority ?? "ALL"}
            onChange={(event) =>
              update({
                priority: event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "ALL", label: "All priorities" },
              ...PRIORITIES.map((p) => ({ value: p, label: PRIORITY_LABELS[p] })),
            ]}
            aria-label="Priority filter"
          />
          <Select
            value={filters.sortBy}
            onChange={(event) =>
              update({
                sortBy: event.target.value === "createdAt" ? null : event.target.value,
                page: 1,
              })
            }
            options={[
              { value: "createdAt", label: "Sort: Newest" },
              { value: "priority", label: "Sort: Most urgent" },
            ]}
            aria-label="Sort order"
          />
          <div className="flex items-center lg:justify-end">
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() => remove(["priority", "sortBy", "page", "limit"])}
              >
                Clear filters
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">No filters applied</span>
            )}
          </div>
        </CardContent>
      </Card>

      {query.isError ? (
        <EmptyState
          title="Failed to load requests"
          description={toApiError(query.error).message}
          action={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      ) : query.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<DropletIcon size={22} />}
          title="No compatible requests"
          description="Check back soon — we will match you with nearby requests as they come in."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
          <Pagination
            total={query.data?.meta.total ?? 0}
            totalPages={query.data?.meta.totalPages ?? 1}
          />
        </>
      )}
    </div>
  );
}

function RequestCard({ request }: { request: BloodRequest }) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <Badge variant="primary" className="text-sm font-bold">
            {BLOOD_GROUP_LABELS[request.bloodGroup as BloodGroup]}
          </Badge>
          <Badge
            variant={
              request.priority === "CRITICAL"
                ? "destructive"
                : request.priority === "HIGH"
                ? "warning"
                : request.priority === "MEDIUM"
                ? "info"
                : "default"
            }
          >
            {PRIORITY_LABELS[request.priority as Priority]}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {initials(request.patientName)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {request.patientName}
            </p>
            <p className="text-xs text-muted-foreground">
              Posted {formatRelativeTime(request.createdAt)}
            </p>
          </div>
        </div>

        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPinIcon size={12} />
          {truncate(`${request.hospitalName} · ${request.location}`, 56)}
        </p>
        <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <DropletIcon size={12} />
          {request.units} unit{request.units === 1 ? "" : "s"} needed
        </p>
      </CardContent>
    </Card>
  );
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

function isPriority(value: string | null): value is Priority {
  return value !== null && (PRIORITIES as readonly string[]).includes(value);
}
