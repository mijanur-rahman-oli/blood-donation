import { NextResponse, type NextRequest } from "next/server";

/* ----------------------------------------------------------------------
   POST /api/auth/register
   ----------------------------------------------------------------------
   Server-side proxy that calls the backend `/auth/register`, then sets
   the `accessToken` and `refreshToken` cookies as httpOnly + Secure +
   SameSite=Lax. Returns the unwrapped `{ user }` to the client.
   ---------------------------------------------------------------------- */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

const ACCESS_MAX_AGE_SECONDS = 60 * 15;            // 15 minutes
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface RegisterBody {
  name?: string;
  email?: string;
  password?: string;
  role?: "DONOR" | "REQUESTER" | "ADMIN";
  phone?: string;
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
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!body?.name || !body?.email || !body?.password || !body?.role || !body?.phone) {
    return NextResponse.json(
      { success: false, message: "name, email, password, role and phone are required" },
      { status: 400 },
    );
  }

  // Backend registration only accepts DONOR and REQUESTER; ADMIN is
  // provisioned out-of-band. Reject here with a clear 400.
  if (body.role !== "DONOR" && body.role !== "REQUESTER") {
    return NextResponse.json(
      { success: false, message: "Role must be DONOR or REQUESTER" },
      { status: 400 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role,
        phone: body.phone,
      }),
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
        message: payload?.message ?? "Registration failed",
        errors: payload?.errors ?? [],
      },
      { status: backendRes.ok ? 500 : backendRes.status },
    );
  }

  const { user, accessToken, refreshToken } = payload.data;

  const response = NextResponse.json(
    { success: true, message: "Registered", data: { user } },
    { status: 201 },
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
