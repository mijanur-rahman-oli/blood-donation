import { NextResponse, type NextRequest } from "next/server";



const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

type RouteCtx = { params: Promise<Record<string, never>> };

async function forward(
  req: NextRequest,
  method: "GET" | "POST" | "PATCH",
): Promise<NextResponse> {
  const accessToken = req.cookies.get("accessToken")?.value;
  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        message: "Not authenticated. Please sign in again.",
      },
      { status: 401 },
    );
  }

  // Build the upstream headers — copy JSON-friendly content headers but
  // never forward the browser's Host / Cookie (we re-attach our own
  // Authorization header from the httpOnly cookie).
  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Authorization", `Bearer ${accessToken}`);
  upstreamHeaders.set("Accept", "application/json");
  if (method !== "GET") {
    upstreamHeaders.set("Content-Type", "application/json");
  }

  const init: RequestInit = {
    method,
    headers: upstreamHeaders,
    // Body only exists for POST / PATCH — forward as raw text to keep
    // the exact body the client sent.
    body: method === "GET" ? undefined : await req.text(),
    cache: "no-store",
  };

  try {
    const upstream = await fetch(`${BACKEND_URL}/donors/profile`, init);
    const text = await upstream.text();

    let json: unknown = text;
    try {
      json = JSON.parse(text);
    } catch {
      // Backend returned non-JSON; surface the raw text.
    }

    return new NextResponse(
      typeof json === "string" ? json : JSON.stringify(json),
      {
        status: upstream.status,
        headers: {
          "content-type":
            upstream.headers.get("content-type") ?? "application/json",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? `Upstream request failed: ${error.message}`
            : "Upstream request failed",
      },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest, _ctx: RouteCtx) {
  return forward(req, "GET");
}

export async function POST(req: NextRequest, _ctx: RouteCtx) {
  return forward(req, "POST");
}

export async function PATCH(req: NextRequest, _ctx: RouteCtx) {
  return forward(req, "PATCH");
}
