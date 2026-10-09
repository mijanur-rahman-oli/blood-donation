import { api } from "@/lib/axios";
import type { ApiResponse, PaginatedResult, Payment, PaymentPurpose } from "@/types";

import { unwrapData, unwrapList } from "./_errors";

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
  const res = await api.post<ApiResponse<InitiatePaymentResult>>(
    "/payments/initiate",
    payload,
  );
  return unwrapData(res);
}

export async function list(
  params: ListPaymentsParams = {},
): Promise<PaginatedResult<Payment>> {
  const res = await api.get<ApiResponse<PaginatedResult<Payment>>>(
    "/payments",
    { params },
  );
  return unwrapList(res);
}

export async function getById(id: string): Promise<Payment> {
  const res = await api.get<ApiResponse<Payment>>(`/payments/${id}`);
  return unwrapData(res);
}
