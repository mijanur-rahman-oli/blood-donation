import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   /api/admin/users
   ----------------------------------------------------------------------
   - GET /api/admin/users?...   → list users (admin-only)
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/admin/users");
}
