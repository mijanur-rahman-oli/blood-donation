import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_COOKIE = "accessToken";

const ROUTE_ROLES: Array<{ prefix: string; role: "ADMIN" | "REQUESTER" | "DONOR" }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/dashboard", role: "REQUESTER" },
  { prefix: "/donor", role: "DONOR" },
];

async function verifyToken(token: string): Promise<{ role: string } | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_ACCESS_SECRET ?? "dev-only-secret",
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as { role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const match = ROUTE_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  if (!match) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    loginUrl.searchParams.set("expired", "1");
    return NextResponse.redirect(loginUrl);
  }

  if (payload.role !== match.role) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/donor/:path*"],
};
