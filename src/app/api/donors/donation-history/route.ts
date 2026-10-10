import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   GET /api/donors/donation-history
   ----------------------------------------------------------------------
   Donor-only endpoint: list the signed-in donor's lifetime donations.
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/donors/donation-history");
}
