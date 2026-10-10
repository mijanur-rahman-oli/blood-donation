import { NextResponse, type NextRequest } from "next/server";



const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

type RouteCtx = { params: Promise<Record<string, never>> };

export async function PATCH(req: NextRequest, _ctx: RouteCtx) {
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

  const body = await req.text();

  try {
    const upstream = await fetch(`${BACKEND_URL}/donors/availability`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    });

    const text = await upstream.text();
    let payload: unknown = text;
    try {
      payload = JSON.parse(text);
    } catch {
      // Non-JSON upstream response.
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
