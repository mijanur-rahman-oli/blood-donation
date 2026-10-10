import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   PATCH /api/admin/users/[id]/role
   ----------------------------------------------------------------------
   Admin updates a user's role. Body shape (forwarded):
     { role: "DONOR" | "REQUESTER" | "ADMIN" }
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/admin/users/${encodeURIComponent(id)}/role`,
    "PATCH",
  );
}
