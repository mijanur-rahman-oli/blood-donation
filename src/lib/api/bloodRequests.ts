import { api } from "@/lib/axios";
import type {
  ApiResponse,
  BloodGroup,
  BloodRequest,
  DonorSearchResult,
  PaginatedResult,
  Priority,
  RequestStatus,
} from "@/types";

import { unwrapData, unwrapList } from "./_errors";

/* ----------------------------------------------------------------------
   Blood requests
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Blood Requests".
   ---------------------------------------------------------------------- */

export interface CreateBloodRequestInput {
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  priority: Priority;
  hospitalName: string;
  location: string;
  neededAt: string;
  contactName: string;
  contactPhone: string;
  notes?: string;
}

export interface UpdateBloodRequestInput {
  patientName?: string;
  bloodGroup?: BloodGroup;
  units?: number;
  priority?: Priority;
  hospitalName?: string;
  location?: string;
  neededAt?: string;
  contactName?: string;
  contactPhone?: string;
  notes?: string;
  status?: RequestStatus;
}

export interface ListBloodRequestsParams {
  page?: number;
  limit?: number;
  status?: RequestStatus;
  priority?: Priority;
  bloodGroup?: BloodGroup;
  sortBy?: "createdAt" | "neededAt" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface SearchBloodRequestsParams extends ListBloodRequestsParams {
  q?: string;
  location?: string;
}

export interface AssignDonorInput {
  donorId: string;
}

export async function create(
  payload: CreateBloodRequestInput,
): Promise<BloodRequest> {
  const res = await api.post<ApiResponse<BloodRequest>>(
    "/blood-requests",
    payload,
  );
  return unwrapData(res);
}

export async function list(
  params: ListBloodRequestsParams = {},
): Promise<PaginatedResult<BloodRequest>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<BloodRequest>>
  >("/blood-requests", { params });
  return unwrapList(res);
}

export async function search(
  params: SearchBloodRequestsParams,
): Promise<PaginatedResult<BloodRequest>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<BloodRequest>>
  >("/blood-requests/search", { params });
  return unwrapList(res);
}

export async function getById(id: string): Promise<BloodRequest> {
  const res = await api.get<ApiResponse<BloodRequest>>(
    `/blood-requests/${id}`,
  );
  return unwrapData(res);
}

export async function update(
  id: string,
  payload: UpdateBloodRequestInput,
): Promise<BloodRequest> {
  const res = await api.patch<ApiResponse<BloodRequest>>(
    `/blood-requests/${id}`,
    payload,
  );
  return unwrapData(res);
}

/** Soft delete (status -> CANCELLED). */
export async function cancel(id: string): Promise<BloodRequest> {
  const res = await api.delete<ApiResponse<BloodRequest>>(
    `/blood-requests/${id}`,
  );
  return unwrapData(res);
}

export async function verify(id: string): Promise<BloodRequest> {
  const res = await api.patch<ApiResponse<BloodRequest>>(
    `/blood-requests/${id}/verify`,
    {},
  );
  return unwrapData(res);
}

export async function getMatches(
  id: string,
): Promise<PaginatedResult<DonorSearchResult>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<DonorSearchResult>>
  >(`/blood-requests/${id}/matches`);
  return unwrapList(res);
}

export async function assignDonor(
  id: string,
  payload: AssignDonorInput,
): Promise<BloodRequest> {
  const res = await api.post<ApiResponse<BloodRequest>>(
    `/blood-requests/${id}/assign-donor`,
    payload,
  );
  return unwrapData(res);
}
