import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ----------------------------------------------------------------------
   POST /api/auth/logout
   ----------------------------------------------------------------------
   Server-side logout. Calls the backend `/auth/logout` (best effort)
   with the refresh token, then clears every auth-related cookie.
   ---------------------------------------------------------------------- */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

const COOKIE_NAMES = [
  "accessToken",
  "refreshToken",
  "accessTokenClient",
  "refreshTokenClient",
] as const;

interface BackendEnvelope {
  success: boolean;
  message: string;
  data?: unknown;
}

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get("refreshToken")?.value;

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch (error) {
      // Best effort — we still clear local cookies below.
      // eslint-disable-next-line no-console
      console.warn("Backend logout failed:", (error as Error).message);
    }
  }

  const response = NextResponse.json(
    { success: true, message: "Logged out", data: null } satisfies BackendEnvelope,
    { status: 200 },
  );

  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, "", {
      httpOnly: name === "accessToken" || name === "refreshToken",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}
