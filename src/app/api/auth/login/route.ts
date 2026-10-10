import { NextResponse, type NextRequest } from "next/server";


const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

const ACCESS_MAX_AGE_SECONDS = 60 * 15;            // 15 minutes
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface LoginBody {
  email?: string;
  password?: string;
}

interface BackendAuthData {
  user: {
    id: string;
    name: string;
    email: string;
    role: "DONOR" | "REQUESTER" | "ADMIN";
    phone?: string | null;
    bloodGroup?: string | null;
    avatarUrl?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}

interface BackendEnvelope {
  success: boolean;
  message: string;
  data?: BackendAuthData;
  errors?: Array<{ path: string; message: string }>;
}

export async function POST(request: NextRequest) {
  let body: LoginBody;
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body?.email || !body?.password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required" },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
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
      {
        success: false,
        message: payload?.message ?? "Login failed",
        errors: payload?.errors ?? [],
      },
      { status: backendRes.ok ? 500 : backendRes.status },
    );
  }

  const { user, accessToken, refreshToken } = payload.data;

  const response = NextResponse.json(
    { success: true, message: "Logged in", data: { user } },
    { status: 200 },
  );

  setAuthCookies(response, accessToken, refreshToken);
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

  // Non-httpOnly mirrors so the client-side axios interceptor can read
  // the access token to build the `Authorization: Bearer …` header. The
  // mirrors are rotated/cleared together with the originals on every
  // refresh, login, and logout.
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
