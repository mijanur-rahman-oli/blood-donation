import type {
  AdminDashboardStats,
  AuditLog,
  BloodRequest,
  PaginatedResult,
  Role,
  User,
  UserStatus,
} from "@/types";

/* ----------------------------------------------------------------------
   localFetch — see donors.ts for the full rationale. Every call hits
   a same-origin /api/* route handler; the browser never talks to the
   upstream backend directly.
   ---------------------------------------------------------------------- */
async function localFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = (await res.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; message: string }
    | { message: string }
    | null;
  if (!res.ok || !json || (json as { success?: boolean }).success !== true) {
    const message =
      json && (json as { message?: string }).message
        ? (json as { message: string }).message
        : `Request to ${path} failed with ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (json as { success: true; data: T }).data;
}

function toQueryString(params: object): string {
  const entries: string[] = [];
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    entries.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  }
  return entries.length === 0 ? "" : `?${entries.join("&")}`;
}

/* ----------------------------------------------------------------------
   Admin
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Admin".
   Every admin endpoint is gated by the proxy at the same origin.
   ---------------------------------------------------------------------- */

export interface ListAdminUsersParams {
  page?: number;
  limit?: number;
  role?: Role;
  status?: UserStatus;
  q?: string;
  sortBy?: "createdAt" | "name" | "email";
  sortOrder?: "asc" | "desc";
}

export interface ListAdminBloodRequestsParams {
  page?: number;
  limit?: number;
  status?: BloodRequest["status"];
  priority?: BloodRequest["priority"];
  bloodGroup?: BloodRequest["bloodGroup"];
}

export interface ListAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  sortBy?: "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface UpdateUserRoleInput {
  role: Role;
}

export interface UpdateUserStatusInput {
  status: UserStatus;
}

export async function listUsers(
  params: ListAdminUsersParams = {},
): Promise<PaginatedResult<User>> {
  const qs = toQueryString(params as Record<string, unknown>);
  return localFetch<PaginatedResult<User>>(
    `/api/admin/users${qs}`,
    { method: "GET" },
  );
}

export async function updateUserRole(
  id: string,
  payload: UpdateUserRoleInput,
): Promise<User> {
  return localFetch<User>(
    `/api/admin/users/${encodeURIComponent(id)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateUserStatus(
  id: string,
  payload: UpdateUserStatusInput,
): Promise<User> {
  return localFetch<User>(
    `/api/admin/users/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  return localFetch<AdminDashboardStats>("/api/admin/dashboard-stats", {
    method: "GET",
  });
}

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<PaginatedResult<AuditLog>> {
  const qs = toQueryString(params as Record<string, unknown>);
  return localFetch<PaginatedResult<AuditLog>>(
    `/api/admin/audit-logs${qs}`,
    { method: "GET" },
  );
}

export async function listAllBloodRequests(
  params: ListAdminBloodRequestsParams = {},
): Promise<PaginatedResult<BloodRequest>> {
  const qs = toQueryString(params as Record<string, unknown>);
  return localFetch<PaginatedResult<BloodRequest>>(
    `/api/admin/blood-requests${qs}`,
    { method: "GET" },
  );
}
