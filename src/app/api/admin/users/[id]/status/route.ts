import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   PATCH /api/admin/users/[id]/status
   ----------------------------------------------------------------------
   Admin updates a user's status (ACTIVE / BLOCKED). Body shape:
     { status: "ACTIVE" | "BLOCKED" }
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/admin/users/${encodeURIComponent(id)}/status`,
    "PATCH",
  );
}
