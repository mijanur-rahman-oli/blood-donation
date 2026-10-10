import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   /api/users/me
   ----------------------------------------------------------------------
   - GET   /api/users/me   → current user
   - PATCH /api/users/me   → update own profile (name, phone)
   ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/users/me");
}

export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, "/users/me", "PATCH");
}
