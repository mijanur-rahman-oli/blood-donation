import type { PaginatedResult, Payment, PaymentPurpose } from "@/types";

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
   Payments
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Payments".
   ---------------------------------------------------------------------- */

export interface InitiatePaymentInput {
  bloodRequestId: string;
  purpose: PaymentPurpose;
  amount: number;
  customerName: string;
  customerPhone: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  gatewayPageURL: string;
}

export interface ListPaymentsParams {
  page?: number;
  limit?: number;
  status?: Payment["status"];
  purpose?: PaymentPurpose;
}

export async function initiate(
  payload: InitiatePaymentInput,
): Promise<InitiatePaymentResult> {
  return localFetch<InitiatePaymentResult>("/api/payments/initiate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function list(
  params: ListPaymentsParams = {},
): Promise<PaginatedResult<Payment>> {
  const qs = toQueryString(params as Record<string, unknown>);
  return localFetch<PaginatedResult<Payment>>(
    `/api/payments${qs}`,
    { method: "GET" },
  );
}

export async function getById(id: string): Promise<Payment> {
  return localFetch<Payment>(
    `/api/payments/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}
