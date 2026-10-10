import type {
  BloodGroup,
  BloodRequest,
  DonorSearchResult,
  PaginatedResult,
  Priority,
  RequestStatus,
} from "@/types";

/* ----------------------------------------------------------------------
   localFetch
   ----------------------------------------------------------------------
   Hits a same-origin /api/* route handler. The browser never talks
   to the upstream backend directly (CORS-free). The route handler
   forwards the request to the backend using the httpOnly access
   token.
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
   Blood requests
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Blood Requests".
   Every call routed through the local /api/blood-requests/* proxies.
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
  return localFetch<BloodRequest>("/api/blood-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function list(
  params: ListBloodRequestsParams = {},
): Promise<PaginatedResult<BloodRequest>> {
  const qs = toQueryString(params as Record<string, unknown>);
  return localFetch<PaginatedResult<BloodRequest>>(
    `/api/blood-requests${qs}`,
    { method: "GET" },
  );
}

export async function search(
  params: SearchBloodRequestsParams,
): Promise<PaginatedResult<BloodRequest>> {
  // search lives on the same proxy and forwards to /blood-requests
  // with the additional `q` and `location` query params.
  const qs = toQueryString(params as Record<string, unknown>);
  return localFetch<PaginatedResult<BloodRequest>>(
    `/api/blood-requests${qs}`,
    { method: "GET" },
  );
}

export async function getById(id: string): Promise<BloodRequest> {
  return localFetch<BloodRequest>(
    `/api/blood-requests/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}

export async function update(
  id: string,
  payload: UpdateBloodRequestInput,
): Promise<BloodRequest> {
  return localFetch<BloodRequest>(
    `/api/blood-requests/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/** Soft delete (status -> CANCELLED). */
export async function cancel(id: string): Promise<BloodRequest> {
  return localFetch<BloodRequest>(
    `/api/blood-requests/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function verify(id: string): Promise<BloodRequest> {
  return localFetch<BloodRequest>(
    `/api/blood-requests/${encodeURIComponent(id)}/verify`,
    { method: "PATCH" },
  );
}

export async function getMatches(
  id: string,
): Promise<PaginatedResult<DonorSearchResult>> {
  return localFetch<PaginatedResult<DonorSearchResult>>(
    `/api/blood-requests/${encodeURIComponent(id)}/matches`,
    { method: "GET" },
  );
}

export async function assignDonor(
  id: string,
  payload: AssignDonorInput,
): Promise<BloodRequest> {
  return localFetch<BloodRequest>(
    `/api/blood-requests/${encodeURIComponent(id)}/assign-donor`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}
