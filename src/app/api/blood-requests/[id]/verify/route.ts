import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   PATCH /api/blood-requests/[id]/verify
   ----------------------------------------------------------------------
   Admin verifies a request (PENDING → VERIFIED). No body required;
   `PATCH /verify` is the canonical verb per the backend route table.
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/blood-requests/${encodeURIComponent(id)}/verify`,
    "PATCH",
  );
}
