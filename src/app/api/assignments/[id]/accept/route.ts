import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   PATCH /api/assignments/[id]/accept
   ----------------------------------------------------------------------
   Donor accepts an assignment that the admin has offered them. Optional
   body is forwarded verbatim.
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/assignments/${encodeURIComponent(id)}/accept`,
    "PATCH",
  );
}
