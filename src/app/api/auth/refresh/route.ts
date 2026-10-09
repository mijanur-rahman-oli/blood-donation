import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

/* ----------------------------------------------------------------------
   POST /api/auth/refresh
   ----------------------------------------------------------------------
   Reads the `refreshToken` cookie, calls the backend
   `/auth/refresh-token`, then rotates the access + refresh cookies
   (and their non-httpOnly mirrors used by the client-side axios
   interceptor).

   Called by:
     1. The edge middleware on token expiry (silent refresh).
     2. The client-side axios response interceptor on 401 responses.
     3. The `useAuth().refresh()` helper from the auth store.
   ---------------------------------------------------------------------- */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

const ACCESS_MAX_AGE_SECONDS = 60 * 15;            // 15 minutes
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface RefreshBody {
  refreshToken?: string;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface BackendEnvelope {
  success: boolean;
  message: string;
  data?: RefreshResult;
}

export async function POST(request: NextRequest) {
  let body: RefreshBody = {};
  try {
    body = (await request.json()) as RefreshBody;
  } catch {
    body = {};
  }

  const store = await cookies();
  const refreshToken =
    body.refreshToken ?? store.get("refreshToken")?.value ?? undefined;

  if (!refreshToken) {
    return NextResponse.json(
      { success: false, message: "No refresh token" },
      { status: 401 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message ?? "Backend unreachable" },
      { status: 502 },
    );
  }

  const payload = (await backendRes.json().catch(() => null)) as BackendEnvelope | null;

  if (!backendRes.ok || !payload || payload.success !== true || !payload.data) {
    return NextResponse.json(
      { success: false, message: payload?.message ?? "Refresh failed" },
      { status: backendRes.ok ? 500 : backendRes.status },
    );
  }

  const { accessToken, refreshToken: newRefresh } = payload.data;
  const rotatedRefresh = newRefresh ?? refreshToken;

  const response = NextResponse.json(
    {
      success: true,
      message: "Token refreshed",
      data: { accessToken, refreshToken: rotatedRefresh },
    },
    { status: 200 },
  );

  setAuthCookies(response, accessToken, rotatedRefresh);
  return response;
}

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
  response.cookies.set("accessTokenClient", accessToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE_SECONDS,
  });
  response.cookies.set("refreshTokenClient", refreshToken, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });
}
