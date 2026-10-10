import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   /api/payments
   ----------------------------------------------------------------------
   - GET  /api/payments?...   → list the signed-in user's payments
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/payments");
}
