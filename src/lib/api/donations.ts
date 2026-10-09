import { api } from "@/lib/axios";
import type { ApiResponse, DonationHistory, PaginatedResult } from "@/types";

import { unwrapData, unwrapList } from "./_errors";

/* ----------------------------------------------------------------------
   Donations
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Donations".
   ---------------------------------------------------------------------- */

export interface ListDonationsParams {
  page?: number;
  limit?: number;
  sortBy?: "donationDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export async function list(
  params: ListDonationsParams = {},
): Promise<PaginatedResult<DonationHistory>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<DonationHistory>>
  >("/donations", { params });
  return unwrapList(res);
}

export async function getById(id: string): Promise<DonationHistory> {
  const res = await api.get<ApiResponse<DonationHistory>>(
    `/donations/${id}`,
  );
  return unwrapData(res);
}
