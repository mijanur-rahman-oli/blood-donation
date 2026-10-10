import type { ApiResponse, DonationAssignment } from "@/types";

/* ----------------------------------------------------------------------
   localFetch
   ----------------------------------------------------------------------
   Same-origin helper for the assignment endpoints. Every call goes
   to a Next.js route handler that forwards to the upstream backend
   using the httpOnly `accessToken` cookie. The browser never talks
   to the deployed backend directly, so CORS is never a problem.
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
   Assignments
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Assignments".
   All four calls go through the local /api/assignments/* proxies.
   ---------------------------------------------------------------------- */

export interface RejectAssignmentInput {
  reason?: string;
}

export interface CompleteAssignmentInput {
  notes?: string;
  donationDate?: string;
}

export async function getById(id: string): Promise<DonationAssignment> {
  return localFetch<DonationAssignment>(
    `/api/assignments/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}

export async function accept(id: string): Promise<DonationAssignment> {
  return localFetch<DonationAssignment>(
    `/api/assignments/${encodeURIComponent(id)}/accept`,
    { method: "PATCH" },
  );
}

export async function reject(
  id: string,
  payload: RejectAssignmentInput = {},
): Promise<DonationAssignment> {
  return localFetch<DonationAssignment>(
    `/api/assignments/${encodeURIComponent(id)}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function complete(
  id: string,
  payload: CompleteAssignmentInput = {},
): Promise<DonationAssignment> {
  return localFetch<DonationAssignment>(
    `/api/assignments/${encodeURIComponent(id)}/complete`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

/* Type re-export so call sites that previously imported `ApiResponse`
 * from this module do not break. */
export type { ApiResponse };
