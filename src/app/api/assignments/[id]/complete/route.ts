import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   PATCH /api/assignments/[id]/complete
   ----------------------------------------------------------------------
   Donor marks the assignment as completed. Body shape (forwarded):
     { notes?: string; donationDate?: string }
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/assignments/${encodeURIComponent(id)}/complete`,
    "PATCH",
  );
}
