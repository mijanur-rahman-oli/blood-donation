import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   /api/blood-requests
   ----------------------------------------------------------------------
   - POST /api/blood-requests           → create a new blood request
   - GET  /api/blood-requests?...       → list/search requests
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/blood-requests");
}

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/blood-requests", "POST");
}
