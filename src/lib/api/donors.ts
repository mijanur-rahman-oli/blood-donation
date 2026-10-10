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
   Used for every donor endpoint so the deployed backend never sees
   the localhost origin (no CORS surface).
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
   Every donor endpoint is routed through the local /api/donors/*
   proxies so the browser never talks to the upstream backend
   directly.
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
  const qs = toQueryString(params);
  const data = await localFetch<PaginatedResult<BloodRequest>>(
    `/api/donors/requests${qs}`,
    { method: "GET" },
  );
  return data;
}

export async function getDonationHistory(
  params: GetDonationHistoryParams = {},
): Promise<PaginatedResult<DonationHistory>> {
  const qs = toQueryString(params);
  const data = await localFetch<PaginatedResult<DonationHistory>>(
    `/api/donors/donation-history${qs}`,
    { method: "GET" },
  );
  return data;
}

export async function searchDonors(
  params: SearchDonorsParams,
): Promise<PaginatedResult<DonorSearchResult>> {
  // searchDonors is admin/requester only and still goes through the
  // public api instance, which now has a relative baseURL and hits
  // /donors/search on the same origin. (The matching proxy is
  // mounted under /api/donors/search if you ever want to add it; for
  // now this endpoint is not invoked from the donor dashboard.)
  const res = await api.get<
    ApiResponse<PaginatedResult<DonorSearchResult>>
  >("/donors/search", { params });
  return unwrapList(res);
}

/* ----------------------------------------------------------------------
   Query-string helper
   ----------------------------------------------------------------------
   Mirrors `toQueryString` from @/lib/utils. Local duplicate so this
   file does not pull in formatters it does not need.
   ---------------------------------------------------------------------- */
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
