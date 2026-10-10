import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/payments/[id]
   ----------------------------------------------------------------------
   Fetch a single payment record by id. Used by the success/cancel
   pages to display the result and by the detail dialog.
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(req, `/payments/${encodeURIComponent(id)}`);
}
