import { NextResponse, type NextRequest } from "next/server";


const ACCESS_COOKIE = "accessToken";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

type SupportedMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

function isSupportedMethod(value: string): value is SupportedMethod {
  return (
    value === "GET" ||
    value === "POST" ||
    value === "PATCH" ||
    value === "PUT" ||
    value === "DELETE"
  );
}

function unauthorized(): NextResponse {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 },
  );
}

function upstreamUnreachable(error: unknown): NextResponse {
  const message =
    error instanceof Error ? error.message : "Upstream request failed";
  return NextResponse.json(
    {
      success: false,
      message: `Upstream request failed: ${message}`,
    },
    { status: 502 },
  );
}

/* ----------------------------------------------------------------------
   proxyToBackend
   ----------------------------------------------------------------------
   Parameters
   ----------
   - req       : The incoming Next.js request
   - path      : Backend path starting with `/`, e.g. `/donors/requests`.
                 Query string is taken from `req.nextUrl.search`.
   - method    : HTTP method. Defaults to `req.method`. Override when a
                 single route handler exposes multiple verbs.

   Behaviour
   ---------
   1. Read `accessToken` cookie. Missing → 401 { success:false,
      message:"Unauthorized" }.
   2. Compose upstream URL: `${API_BASE_URL}${path}${search}`.
   3. Copy `content-type` from the incoming request (or default to
      `application/json` for non-GET). Never forward `host`, `cookie`,
      or `authorization` from the browser.
   4. For POST/PUT/PATCH, forward the raw body. For GET/DELETE, omit.
   5. Cache: `no-store` so we never serve a stale proxy response.
   6. On network failure → 502. On upstream 4xx/5xx → forward the
      status + JSON body verbatim.
   ---------------------------------------------------------------------- */

export async function proxyToBackend(
  req: NextRequest,
  path: string,
  methodOverride?: string,
): Promise<NextResponse> {
  const methodRaw = (methodOverride ?? req.method ?? "GET").toUpperCase();
  if (!isSupportedMethod(methodRaw)) {
    return NextResponse.json(
      { success: false, message: `Unsupported method: ${methodRaw}` },
      { status: 405 },
    );
  }
  const method: SupportedMethod = methodRaw;

  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!accessToken) return unauthorized();

  const search = req.nextUrl.search ?? "";
  const target = `${API_BASE_URL}${path}${search}`;

  // Headers: we never trust the browser's Host / Cookie / Authorization.
  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Authorization", `Bearer ${accessToken}`);
  upstreamHeaders.set("Accept", "application/json");
  if (method !== "GET" && method !== "DELETE") {
    const incomingType = req.headers.get("content-type");
    upstreamHeaders.set(
      "Content-Type",
      incomingType && incomingType.trim().length > 0
        ? incomingType
        : "application/json",
    );
  }

  let body: BodyInit | undefined;
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    try {
      body = await req.text();
    } catch {
      body = undefined;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method,
      headers: upstreamHeaders,
      body,
      cache: "no-store",
    });
  } catch (error) {
    return upstreamUnreachable(error);
  }

  const text = await upstream.text();
  let payload: unknown = text;
  try {
    payload = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    // Upstream returned non-JSON. Keep `payload` as the raw text.
  }

  return new NextResponse(
    typeof payload === "string" ? payload : JSON.stringify(payload),
    {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    },
  );
}
