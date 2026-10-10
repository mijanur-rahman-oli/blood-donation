import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/assignments/[id]
   ----------------------------------------------------------------------
   Fetch a single donation assignment by id. Used by the donor
   dashboard's assignment detail panel.
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(req, `/assignments/${encodeURIComponent(id)}`);
}
