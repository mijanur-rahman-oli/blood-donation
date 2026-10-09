import { api } from "@/lib/axios";
import type { ApiResponse, DonationAssignment } from "@/types";

import { unwrapData } from "./_errors";

/* ----------------------------------------------------------------------
   Assignments
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Assignments".
   ---------------------------------------------------------------------- */

export interface RejectAssignmentInput {
  reason?: string;
}

export interface CompleteAssignmentInput {
  notes?: string;
  donationDate?: string;
}

export async function getById(id: string): Promise<DonationAssignment> {
  const res = await api.get<ApiResponse<DonationAssignment>>(
    `/assignments/${id}`,
  );
  return unwrapData(res);
}

export async function accept(id: string): Promise<DonationAssignment> {
  const res = await api.patch<ApiResponse<DonationAssignment>>(
    `/assignments/${id}/accept`,
    {},
  );
  return unwrapData(res);
}

export async function reject(
  id: string,
  payload: RejectAssignmentInput = {},
): Promise<DonationAssignment> {
  const res = await api.patch<ApiResponse<DonationAssignment>>(
    `/assignments/${id}/reject`,
    payload,
  );
  return unwrapData(res);
}

export async function complete(
  id: string,
  payload: CompleteAssignmentInput = {},
): Promise<DonationAssignment> {
  const res = await api.patch<ApiResponse<DonationAssignment>>(
    `/assignments/${id}/complete`,
    payload,
  );
  return unwrapData(res);
}
