import type { NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_proxy";

/* ----------------------------------------------------------------------
   POST /api/payments/initiate
   ----------------------------------------------------------------------
   Requester creates a new payment. The backend returns
     { success: true, data: { paymentId, gatewayPageURL } }
   which the client uses to redirect to the gateway.
   ---------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  return proxyToBackend(req, "/payments/initiate", "POST");
}
