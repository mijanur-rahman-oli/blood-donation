import type { User } from "@/types";

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

/* ----------------------------------------------------------------------
   Users
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Users".
   ---------------------------------------------------------------------- */

export interface UpdateMeInput {
  name?: string;
  phone?: string;
}

export async function getMe(): Promise<User> {
  return localFetch<User>("/api/users/me", { method: "GET" });
}

export async function updateMe(payload: UpdateMeInput): Promise<User> {
  return localFetch<User>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
