import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";



type RouteCtx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteCtx) {
  const { id } = await params;
  return proxyToBackend(req, `/payments/${encodeURIComponent(id)}`);
}
