"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Skeleton,
} from "@/components/admin/primitives";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatCard } from "@/components/shared/StatCard";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import { useAuth } from "@/hooks/useAuth";
import {
  BLOOD_GROUP_LABELS,
  PRIORITY_LABELS,
} from "@/lib/constants";
import {
  DropletIcon,
  PlusCircleIcon,
} from "@/components/dashboard/icons";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type {
  BloodRequest,
  PaginatedResult,
  Priority,
  RequestStatus,
} from "@/types";

/* ----------------------------------------------------------------------
   /dashboard — Requester overview
   ----------------------------------------------------------------------
   Pulls the most recent 5 blood requests, derives the four KPI counts
   from that list (good enough for a "personal activity" overview), and
   renders a primary CTA + recent-requests card with empty/error/
   loading/success states.
   ---------------------------------------------------------------------- */

const RECENT_LIMIT = 5;

export default function DashboardOverviewPage() {
  const { user } = useAuth();

  const query = useQuery<PaginatedResult<BloodRequest>, Error>({
    queryKey: ["blood-requests", { page: 1, limit: RECENT_LIMIT, sortBy: "createdAt", sortOrder: "desc" }],
    queryFn: () =>
      bloodRequestsApi.list({
        page: 1,
        limit: RECENT_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    staleTime: 30_000,
  });

  const requests = query.data?.result ?? [];
  const firstName = (user?.name ?? "").split(/\s+/)[0] || "there";

  const counts = computeCounts(requests);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s your request activity
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {query.isLoading || !query.data ? (
          Array.from({ length: 4 }).map((_, i) => (
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
              label="Total Requests"
              value={counts.total}
              description="Lifetime"
              tone="primary"
            />
            <StatCard
              label="Pending"
              value={counts.pending}
              description="Awaiting admin"
              tone="warning"
            />
            <StatCard
              label="In Progress"
              value={counts.inProgress}
              description="Verified / Matching / Assigned"
              tone="info"
            />
            <StatCard
              label="Completed"
              value={counts.completed}
              description="Donation delivered"
              tone="success"
            />
          </>
        )}
      </section>

      {/* CTA */}
      <section>
        <Link
          href="/dashboard/requests/new"
          className="flex items-center justify-between gap-4 rounded-2xl bg-primary px-6 py-5 text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          <div>
            <p className="text-base font-semibold">Need blood urgently?</p>
            <p className="text-sm opacity-90">
              Post a verified request and we will find a compatible donor in minutes.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-md bg-background px-4 py-2 text-sm font-semibold text-foreground">
            <PlusCircleIcon size={16} /> New Blood Request
          </span>
        </Link>
      </section>

      {/* Recent requests */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Requests</CardTitle>
          <Link
            href="/dashboard/requests/new"
            className="text-sm font-medium text-primary hover:underline"
          >
            New request →
          </Link>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border border-border p-3"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <p className="text-sm text-destructive">
              {query.error?.message ?? "Failed to load your requests."}
            </p>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<DropletIcon size={22} />}
              title="No requests yet"
              description="Create your first blood request to get started."
              action={
                <Link
                  href="/dashboard/requests/new"
                  className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  Create your first request
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {requests.map((request) => (
                <li
                  key={request.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                    >
                      <DropletIcon size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {request.patientName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {request.hospitalName} · {request.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="primary">
                      {BLOOD_GROUP_LABELS[request.bloodGroup]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {request.units} unit{request.units === 1 ? "" : "s"}
                    </span>
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
                    <StatusBadge status={request.status} />
                    <Link
                      href={`/dashboard/requests/${request.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                      title={formatDate(request.createdAt)}
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {requests.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Last updated {formatRelativeTime(query.dataUpdatedAt)}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------------- */
function computeCounts(requests: BloodRequest[]) {
  const counts = { total: 0, pending: 0, inProgress: 0, completed: 0 };
  for (const request of requests) {
    counts.total += 1;
    const status: RequestStatus = request.status;
    if (status === "PENDING") counts.pending += 1;
    else if (status === "VERIFIED" || status === "MATCHING" || status === "ASSIGNED")
      counts.inProgress += 1;
    else if (status === "COMPLETED") counts.completed += 1;
  }
  return counts;
}
