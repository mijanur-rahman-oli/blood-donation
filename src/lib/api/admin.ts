import { api } from "@/lib/axios";
import type {
  AdminDashboardStats,
  ApiResponse,
  AuditLog,
  BloodRequest,
  PaginatedResult,
  Role,
  User,
  UserStatus,
} from "@/types";

import { unwrapData, unwrapList } from "./_errors";

/* ----------------------------------------------------------------------
   Admin
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Admin".
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
  const res = await api.get<ApiResponse<PaginatedResult<User>>>(
    "/admin/users",
    { params },
  );
  return unwrapList(res);
}

export async function updateUserRole(
  id: string,
  payload: UpdateUserRoleInput,
): Promise<User> {
  const res = await api.patch<ApiResponse<User>>(
    `/admin/users/${id}/role`,
    payload,
  );
  return unwrapData(res);
}

export async function updateUserStatus(
  id: string,
  payload: UpdateUserStatusInput,
): Promise<User> {
  const res = await api.patch<ApiResponse<User>>(
    `/admin/users/${id}/status`,
    payload,
  );
  return unwrapData(res);
}

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const res = await api.get<ApiResponse<AdminDashboardStats>>(
    "/admin/dashboard-stats",
  );
  return unwrapData(res);
}

export async function listAuditLogs(
  params: ListAuditLogsParams = {},
): Promise<PaginatedResult<AuditLog>> {
  const res = await api.get<ApiResponse<PaginatedResult<AuditLog>>>(
    "/admin/audit-logs",
    { params },
  );
  return unwrapList(res);
}

export async function listAllBloodRequests(
  params: ListAdminBloodRequestsParams = {},
): Promise<PaginatedResult<BloodRequest>> {
  const res = await api.get<ApiResponse<PaginatedResult<BloodRequest>>>(
    "/admin/blood-requests",
    { params },
  );
  return unwrapList(res);
}
