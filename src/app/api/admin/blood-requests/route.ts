import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/admin/blood-requests
   ----------------------------------------------------------------------
   Admin-side list of every blood request across the platform.
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/admin/blood-requests");
}
