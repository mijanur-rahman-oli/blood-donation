import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   /api/blood-requests/[id]
   ----------------------------------------------------------------------
   - GET    /api/blood-requests/[id]    → fetch a single request
   - PATCH  /api/blood-requests/[id]    → update fields (e.g. status)
   - DELETE /api/blood-requests/[id]    → soft delete → status CANCELLED
   ---------------------------------------------------------------------- */

type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(req, `/blood-requests/${encodeURIComponent(id)}`);
}

export async function PATCH(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/blood-requests/${encodeURIComponent(id)}`,
    "PATCH",
  );
}

export async function DELETE(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(
    req,
    `/blood-requests/${encodeURIComponent(id)}`,
    "DELETE",
  );
}
