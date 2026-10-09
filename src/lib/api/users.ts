import { api } from "@/lib/axios";
import type { ApiResponse, User } from "@/types";

import { unwrapData } from "./_errors";

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
  const res = await api.get<ApiResponse<User>>("/users/me");
  return unwrapData(res);
}

export async function updateMe(payload: UpdateMeInput): Promise<User> {
  const res = await api.patch<ApiResponse<User>>("/users/me", payload);
  return unwrapData(res);
}
