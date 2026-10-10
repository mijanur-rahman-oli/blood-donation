import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/donors/requests
   ----------------------------------------------------------------------
   Donor-only endpoint: list blood requests compatible with the signed-in
   donor. Auth is read from the httpOnly `accessToken` cookie server-side,
   so the browser never needs to talk to the upstream backend directly.
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/donors/requests");
}
