import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/* ----------------------------------------------------------------------
   GET /api/auth/me
   ----------------------------------------------------------------------
   Reads the `accessToken` cookie and proxies `/users/me` to the backend
   with the `Authorization: Bearer …` header. Returns the unwrapped
   `user` to the caller.

   Used by the Zustand store's `hydrate()` action on first mount so the
   session is restored without exposing the token to JavaScript.
   ---------------------------------------------------------------------- */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

interface UserShape {
  id: string;
  name: string;
  email: string;
  role: "DONOR" | "REQUESTER" | "ADMIN";
  phone?: string | null;
  bloodGroup?: string | null;
  avatarUrl?: string | null;
}

interface BackendEnvelope {
  success: boolean;
  message: string;
  data?: UserShape;
}

export async function GET() {
  const store = await cookies();
  const accessToken = store.get("accessToken")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
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
      { success: false, message: payload?.message ?? "Failed to fetch user" },
      { status: backendRes.ok ? 500 : backendRes.status },
    );
  }

  return NextResponse.json(
    { success: true, message: "OK", data: payload.data },
    { status: 200 },
  );
}
