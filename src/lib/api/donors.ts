import { api } from "@/lib/axios";
import type {
  ApiResponse,
  BloodGroup,
  BloodRequest,
  DonationHistory,
  DonorProfile,
  DonorSearchResult,
  PaginatedResult,
  Priority,
} from "@/types";

import { unwrapList } from "./_errors";

/* ----------------------------------------------------------------------
   localFetch
   ----------------------------------------------------------------------
   Hits a same-origin Next.js API route handler. The browser sends
   the httpOnly auth cookies automatically and the route handler
   forwards to the upstream backend with the httpOnly access token.
   We use this for every donor mutation + the donor-profile read so
   the deployed backend never sees the localhost origin.
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

/* ----------------------------------------------------------------------
   Donors
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Donors".

   The auth-required mutations (createProfile, updateProfile,
   updateAvailability) and the auth-required read (getMyProfile) are
   routed through the local Next.js API proxies under /api/donors/*
   so the request carries the httpOnly access-token cookie
   automatically. The browser -> backend CORS surface is fully
   contained inside the route handlers.

   Public reads (getCompatibleRequests, getDonationHistory,
   searchDonors) still go through the configured api instance — they
   either accept the anonymous role or piggy-back on the public mirror
   cookie when available.
   ---------------------------------------------------------------------- */

export interface CreateDonorProfileInput {
  bloodGroup: BloodGroup;
  location: string;
  weightKg: number;
  ageYears: number;
}

export interface UpdateDonorProfileInput {
  bloodGroup?: BloodGroup;
  location?: string;
  weightKg?: number;
  ageYears?: number;
  availability?: boolean;
}

export interface UpdateAvailabilityInput {
  availability: boolean;
}

export interface GetCompatibleRequestsParams {
  page?: number;
  limit?: number;
  priority?: Priority;
  bloodGroup?: BloodGroup;
  sortBy?: "createdAt" | "priority";
  sortOrder?: "asc" | "desc";
}

export interface GetDonationHistoryParams {
  page?: number;
  limit?: number;
}

export interface SearchDonorsParams {
  bloodGroup?: BloodGroup;
  availability?: boolean;
  location?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export async function createProfile(
  payload: CreateDonorProfileInput,
): Promise<DonorProfile> {
  return localFetch<DonorProfile>("/api/donors/profile", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyProfile(): Promise<DonorProfile> {
  return localFetch<DonorProfile>("/api/donors/profile", { method: "GET" });
}

export async function updateProfile(
  payload: UpdateDonorProfileInput,
): Promise<DonorProfile> {
  return localFetch<DonorProfile>("/api/donors/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAvailability(
  payload: UpdateAvailabilityInput,
): Promise<DonorProfile> {
  return localFetch<DonorProfile>("/api/donors/availability", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getCompatibleRequests(
  params: GetCompatibleRequestsParams = {},
): Promise<PaginatedResult<BloodRequest>> {
  const res = await api.get<ApiResponse<PaginatedResult<BloodRequest>>>(
    "/donors/requests",
    { params },
  );
  return unwrapList(res);
}

export async function getDonationHistory(
  params: GetDonationHistoryParams = {},
): Promise<PaginatedResult<DonationHistory>> {
  const res = await api.get<ApiResponse<PaginatedResult<DonationHistory>>>(
    "/donors/donation-history",
    { params },
  );
  return unwrapList(res);
}

export async function searchDonors(
  params: SearchDonorsParams,
): Promise<PaginatedResult<DonorSearchResult>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<DonorSearchResult>>
  >("/donors/search", { params });
  return unwrapList(res);
}
