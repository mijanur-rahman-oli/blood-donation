import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/admin/dashboard-stats
   ----------------------------------------------------------------------
   Aggregated KPIs for the admin dashboard.
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/admin/dashboard-stats");
}
