import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/blood-requests/[id]/matches
   ----------------------------------------------------------------------
   Admin-only: list compatible donor candidates for a verified request.
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/blood-requests/${encodeURIComponent(id)}/matches`,
  );
}
