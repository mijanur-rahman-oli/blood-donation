import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";



export async function GET(req: NextRequest) {
  return proxyToBackend(req, "/donors/requests");
}
