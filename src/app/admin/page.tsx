"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Skeleton } from "@/components/admin/primitives";
import { LineChart, PieChart, type PieChartDatum } from "@/components/admin/ChartFallback";
import {
  DollarSignIcon,
  DropletIcon,
  HeartIcon,
  UsersIcon,
} from "@/components/admin/icons";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import * as adminApi from "@/lib/api/admin";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import { BLOOD_GROUP_LABELS, PRIORITY_LABELS } from "@/lib/constants";
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
   Client component. Four TanStack Query keys:
     - ["admin", "stats"]                          2 min stale
     - ["admin", "blood-requests", "recent"]       30s stale
     - ["admin", "audit-logs", "recent"]           30s stale
   Renders 4 StatCards, a line chart, a pie chart, a recent-requests
   list, and a recent-activity list. Handles the 4 mandatory states
   (loading / empty / error / success) per list.
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform overview</p>
      </header>

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
              value={stats.data.totalUsers.toLocaleString()}
              description={`${stats.data.totalDonors} donors · ${stats.data.totalRequesters} requesters`}
              tone="info"
            />
            <StatCard
              icon={<DropletIcon size={18} />}
              label="Active Requests"
              value={(stats.data.requestsByStatus.PENDING +
                stats.data.requestsByStatus.VERIFIED +
                stats.data.requestsByStatus.MATCHING +
                stats.data.requestsByStatus.ASSIGNED).toLocaleString()}
              description="PENDING + VERIFIED + MATCHING + ASSIGNED"
              tone="primary"
            />
            <StatCard
              icon={<HeartIcon size={18} />}
              label="Completed Donations"
              value={stats.data.totalCompletedDonations.toLocaleString()}
              description="Lifetime"
              tone="success"
            />
            <StatCard
              icon={<DollarSignIcon size={18} />}
              label="Total Revenue"
              value={formatCurrency(stats.data.totalRevenue)}
              description="From verification fees"
              tone="default"
            />
          </>
        )}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Requests over last 30 days</CardTitle>
            <CardDescription>Daily volume of new blood requests</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading || !stats.data ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <LineChart
                data={buildDailySeries(stats.data)}
                xKey="day"
                dataKey="count"
                height={240}
                yLabel="Requests"
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blood group distribution</CardTitle>
            <CardDescription>Donors per ABO + Rh group</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.isLoading || !stats.data ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <PieChart data={buildPieData(stats.data.donorsByBloodGroup)} height={240} />
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
    </div>
  );
}

/* ----------------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------------- */
function buildDailySeries(stats: AdminDashboardStats): Array<{ day: string; count: number }> {
  // Prefer the optional `monthlyRequests` timeseries. If absent, fall
  // back to a flat 30-day stub seeded from totalBloodRequests so the
  // chart always renders something sensible.
  if (stats.monthlyRequests && stats.monthlyRequests.length > 0) {
    return stats.monthlyRequests.map((m) => ({ day: m.month, count: m.count }));
  }
  const total = stats.totalBloodRequests;
  const seed = total > 0 ? Math.max(1, Math.round(total / 30)) : 0;
  return Array.from({ length: 30 }, (_, i) => ({
    day: `D${i + 1}`,
    count: seed,
  }));
}

function buildPieData(breakdown: AdminDashboardStats["donorsByBloodGroup"]): PieChartDatum[] {
  const groups: BloodGroup[] = [
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
  ];
  return groups.map((group) => ({
    name: BLOOD_GROUP_LABELS[group],
    value: breakdown?.[group] ?? 0,
  }));
}
