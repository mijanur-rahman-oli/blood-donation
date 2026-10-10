import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   PATCH /api/assignments/[id]/reject
   ----------------------------------------------------------------------
   Donor rejects an offered assignment. Body shape (forwarded as-is):
     { reason?: string }
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/assignments/${encodeURIComponent(id)}/reject`,
    "PATCH",
  );
}
