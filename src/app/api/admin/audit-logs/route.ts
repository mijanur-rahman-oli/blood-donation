import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/admin/audit-logs
   ----------------------------------------------------------------------
   Paginated list of audit-log entries.
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/admin/audit-logs");
}
