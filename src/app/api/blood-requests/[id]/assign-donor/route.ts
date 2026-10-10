import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   POST /api/blood-requests/[id]/assign-donor
   ----------------------------------------------------------------------
   Admin assigns a specific donor to a verified request. Body shape
   (forwarded verbatim):
     { donorId: string }
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/blood-requests/${encodeURIComponent(id)}/assign-donor`,
    "POST",
  );
}
