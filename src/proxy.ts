import { NextRequest, NextResponse } from "next/server";
import { decodeJwt, jwtVerify } from "jose";

/* ----------------------------------------------------------------------
   Edge Proxy (formerly `middleware.ts`)
   ----------------------------------------------------------------------
   Next.js 16 renamed the `middleware` convention to `proxy`. This file
   preserves every behaviour we landed during the role-guard fix:
   verifies the access-token JWT, decodes the role claim from any of
   the common shapes, and routes /admin → ADMIN, /dashboard →
   REQUESTER, /donor → DONOR. The <RoleGuard> component is only
   defense-in-depth; this is the primary edge-level gate.
   ---------------------------------------------------------------------- */

const ACCESS_COOKIE = "accessToken";

type Role = "ADMIN" | "REQUESTER" | "DONOR";

const ROUTE_ROLES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/dashboard", role: "REQUESTER" },
  { prefix: "/donor", role: "DONOR" },
];

type UnknownRecord = Record<string, unknown>;

function getSecret(): Uint8Array | null {
  const raw = process.env.JWT_ACCESS_SECRET;
  if (!raw || raw.trim().length === 0) {
    return null;
  }
  return new TextEncoder().encode(raw);
}

function pickRole(payload: UnknownRecord): string | null {
  const candidates: Array<unknown> = [
    payload.role,
    payload.userRole,
    (payload.user as UnknownRecord | undefined)?.role,
    (payload.data as UnknownRecord | undefined)?.role,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

async function readRoleFromToken(token: string): Promise<{
  role: string | null;
  payload: UnknownRecord | null;
  verified: boolean;
  reason: "ok" | "no-secret" | "expired" | "invalid" | "no-role";
}> {
  const secret = getSecret();

  if (secret) {
    try {
      const { payload } = await jwtVerify(token, secret);
      const record = payload as UnknownRecord;
      const role = pickRole(record);
      return {
        role: role ? role.toUpperCase() : null,
        payload: record,
        verified: true,
        reason: role ? "ok" : "no-role",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message.toLowerCase() : "";
      if (message.includes("exp")) {
        return { role: null, payload: null, verified: true, reason: "expired" };
      }
      return { role: null, payload: null, verified: true, reason: "invalid" };
    }
  }

  // Dev fallback: no secret in env → warn loudly + decode unverified.
  // eslint-disable-next-line no-console
  console.warn(
    "[proxy] JWT_ACCESS_SECRET is not set — decoding token without verification. " +
      "Set JWT_ACCESS_SECRET in .env.local before deploying.",
  );

  try {
    const payload = decodeJwt(token) as UnknownRecord;
    const role = pickRole(payload);
    return {
      role: role ? role.toUpperCase() : null,
      payload,
      verified: false,
      reason: role ? "no-secret" : "no-role",
    };
  } catch {
    return { role: null, payload: null, verified: false, reason: "invalid" };
  }
}

function findRequiredRole(pathname: string): Role | null {
  for (const entry of ROUTE_ROLES) {
    if (pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)) {
      return entry.role;
    }
  }
  return null;
}

function loginRedirect(req: NextRequest, expired = false): NextResponse {
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set(
    "redirect",
    req.nextUrl.pathname + req.nextUrl.search,
  );
  if (expired) loginUrl.searchParams.set("expired", "1");
  return NextResponse.redirect(loginUrl);
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const requiredRole = findRequiredRole(pathname);
  if (!requiredRole) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value ?? null;

  // eslint-disable-next-line no-console
  console.log("[proxy]", {
    pathname,
    requiredRole,
    hasToken: Boolean(token),
  });

  if (!token) {
    // eslint-disable-next-line no-console
    console.log("[proxy] no token → /login");
    return loginRedirect(req);
  }

  const { role, payload, reason } = await readRoleFromToken(token);

  // eslint-disable-next-line no-console
  console.log("[proxy] token payload:", JSON.stringify(payload));
  // eslint-disable-next-line no-console
  console.log("[proxy] resolved role:", role, "(reason:", reason + ")");

  if (reason === "expired" || reason === "invalid") {
    // eslint-disable-next-line no-console
    console.log("[proxy] token invalid/expired → /login?expired=1");
    return loginRedirect(req, true);
  }

  if (!role) {
    // eslint-disable-next-line no-console
    console.log("[proxy] token has no role claim → /login?expired=1");
    return loginRedirect(req, true);
  }

  if (role !== requiredRole) {
    // eslint-disable-next-line no-console
    console.log(
      `[proxy] role mismatch (have ${role}, need ${requiredRole}) → /unauthorized`,
    );
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // eslint-disable-next-line no-console
  console.log("[proxy] role ok → next()");
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/donor/:path*"],
};
