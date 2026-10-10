"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "@/components/admin/primitives";
import {
  BarChart,
  PieChart,
  type BarChartDatum,
  type PieChartDatum,
} from "@/components/admin/ChartFallback";
import {
  DollarSignIcon,
  DropletIcon,
  HeartIcon,
  UsersIcon,
} from "@/components/admin/icons";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import * as adminApi from "@/lib/api/admin";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import { BLOOD_GROUPS, BLOOD_GROUP_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type {
  AdminDashboardStats,
  AuditLog,
  BloodGroup,
  BloodRequest,
  PaginatedResult,
  Priority,
} from "@/types";

/* ----------------------------------------------------------------------
   /admin — Dashboard
   ----------------------------------------------------------------------
   Client component. Three TanStack Query keys:
     - ["admin", "stats"]                          2 min stale
     - ["admin", "blood-requests", "recent"]       30s stale
     - ["admin", "audit-logs", "recent"]           30s stale

   The backend dashboard-stats endpoint returns a flat record of
   headline counts (totalUsers, pendingRequests, totalDonations,
   totalRevenue, etc.). The four StatCards reflect those counts.

   The two charts no longer rely on `requestsByStatus`,
   `usersByRole`, or `donorsByBloodGroup` from the stats payload
   (those keys are not returned by the backend). Instead:
     - BarChart summarises the four headline counts so the
       dashboard has a clear visual at-a-glance.
     - PieChart shows the blood-group distribution of the
       most recent requests (derived from the recent-requests
       query, which is fetched separately).

   All numeric fields read from `stats.data` use the `?? 0`
   fallback so a missing field never crashes the page.
   ---------------------------------------------------------------------- */

const RECENT_LIMIT = 5;

export default function AdminDashboardPage() {
  const stats = useQuery<AdminDashboardStats, Error>({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 2 * 60 * 1000,
  });

  const recentRequests = useQuery<PaginatedResult<BloodRequest>, Error>({
    queryKey: ["admin", "blood-requests", "recent"],
    queryFn: () =>
      bloodRequestsApi.list({
        page: 1,
        limit: RECENT_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    staleTime: 30_000,
  });

  const recentActivity = useQuery<PaginatedResult<AuditLog>, Error>({
    queryKey: ["admin", "audit-logs", "recent"],
    queryFn: () => adminApi.listAuditLogs({ page: 1, limit: RECENT_LIMIT }),
    staleTime: 30_000,
  });

  // Derived: blood-group distribution of the recent-requests list.
  // Used to drive the pie chart without needing a dedicated endpoint.
  const bloodGroupPieData = useMemo<PieChartDatum[]>(() => {
    const counts: Record<BloodGroup, number> = {
      A_POSITIVE: 0,
      A_NEGATIVE: 0,
      B_POSITIVE: 0,
      B_NEGATIVE: 0,
      AB_POSITIVE: 0,
      AB_NEGATIVE: 0,
      O_POSITIVE: 0,
      O_NEGATIVE: 0,
    };
    for (const req of recentRequests.data?.result ?? []) {
      const bg = req.bloodGroup;
      if (bg in counts) counts[bg] += 1;
    }
    // Always render all 8 buckets so the chart shape stays stable
    // even when the recent list is empty.
    return BLOOD_GROUPS.map((group) => ({
      name: BLOOD_GROUP_LABELS[group],
      value: counts[group],
    }));
  }, [recentRequests.data]);

  // Derived: headline counts for the BarChart. Always uses the
  // current query data and the `?? 0` fallback.
  const overviewBars = useMemo<BarChartDatum[]>(() => {
    const d = stats.data;
    return [
      { name: "Users", value: d?.totalUsers ?? 0 },
      { name: "Requests", value: d?.totalBloodRequests ?? 0 },
      { name: "Donations", value: d?.totalDonations ?? 0 },
      { name: "Payments", value: d?.totalPayments ?? 0 },
    ];
  }, [stats.data]);

  if (stats.isError) {
    return (
      <EmptyState
        title="Failed to load dashboard"
        description={
          stats.error?.message ||
          "We could not fetch the platform overview. Please try again."
        }
        action={
          <button
            type="button"
            onClick={() => stats.refetch()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Platform overview"
      />

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading || !stats.data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              icon={<UsersIcon size={18} />}
              label="Total Users"
              value={(stats.data.totalUsers ?? 0).toLocaleString()}
              description={`${stats.data.totalDonors ?? 0} donors · ${stats.data.totalRequesters ?? 0} requesters`}
              tone="info"
            />
            <StatCard
              icon={<DropletIcon size={18} />}
              label="Pending Requests"
              value={(stats.data.pendingRequests ?? 0).toLocaleString()}
              description={`${stats.data.totalBloodRequests ?? 0} total · ${stats.data.completedRequests ?? 0} completed`}
              tone="primary"
            />
            <StatCard
              icon={<HeartIcon size={18} />}
              label="Completed Donations"
              value={(stats.data.totalDonations ?? 0).toLocaleString()}
              description="Lifetime donations"
              tone="success"
            />
            <StatCard
              icon={<DollarSignIcon size={18} />}
              label="Total Revenue"
              value={formatCurrency(stats.data.totalRevenue ?? 0)}
              description={`${stats.data.totalPayments ?? 0} payments`}
              tone="default"
            />
          </>
        )}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform overview</CardTitle>
            <CardDescription>
              Headline counts from the latest stats snapshot
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading || !stats.data ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <BarChart data={overviewBars} height={200} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent requests by blood group</CardTitle>
            <CardDescription>
              Distribution across the {RECENT_LIMIT} most recent requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.isLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <PieChart data={bloodGroupPieData} height={200} />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent tables */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Latest 5 blood requests</CardDescription>
            </div>
            <Link
              href="/admin/requests"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentRequests.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: RECENT_LIMIT }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : recentRequests.isError ? (
              <p className="text-sm text-destructive">
                {recentRequests.error?.message ?? "Failed to load requests."}
              </p>
            ) : (recentRequests.data?.result.length ?? 0) === 0 ? (
              <EmptyState
                title="No recent requests"
                description="New requests will appear here as they come in."
              />
            ) : (
              <ul className="space-y-2">
                {(recentRequests.data?.result ?? []).map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {req.patientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {req.hospitalName} · {req.location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="primary">{BLOOD_GROUP_LABELS[req.bloodGroup]}</Badge>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} />
                        <Badge
                          variant={
                            req.priority === "CRITICAL"
                              ? "destructive"
                              : req.priority === "HIGH"
                              ? "warning"
                              : req.priority === "MEDIUM"
                              ? "info"
                              : "default"
                          }
                        >
                          {PRIORITY_LABELS[req.priority as Priority]}
                        </Badge>
                      </div>
                    </div>
                    <Link
                      href={`/admin/requests?id=${req.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest 5 audit log entries</CardDescription>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: RECENT_LIMIT }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : recentActivity.isError ? (
              <p className="text-sm text-destructive">
                {recentActivity.error?.message ?? "Failed to load activity."}
              </p>
            ) : (recentActivity.data?.result.length ?? 0) === 0 ? (
              <EmptyState
                title="No recent activity"
                description="Admin actions will be logged here as they happen."
              />
            ) : (
              <ul className="space-y-2">
                {(recentActivity.data?.result ?? []).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {entry.actor?.name ?? "System"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.action} · {entry.entityType} #{entry.entityId.slice(0, 6)}
                      </p>
                    </div>
                    <span
                      className="text-xs text-muted-foreground"
                      title={formatDateTime(entry.createdAt)}
                    >
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </PageContainer>
  );
}
