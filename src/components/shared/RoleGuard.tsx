"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

/* ----------------------------------------------------------------------
   RoleGuard
   ----------------------------------------------------------------------
   Client-side guard for role-restricted routes. Used by the per-area
   layouts (`/admin/layout.tsx`, `/dashboard/layout.tsx`,
   `/donor/layout.tsx`).

   Rules (in order):
     1. If the auth store has not finished hydrating → render a
        neutral Skeleton. NEVER redirect while unhydrated — the
        middleware has already gated the route at the edge and
        RoleGuard is only defense-in-depth.
     2. If hydrated and `user === null` → redirect to
        /login?redirect=<current pathname + search>.
     3. If hydrated and `user.role` is not in `allow` → redirect to
        /unauthorized.
     4. Otherwise render `children`.

   The redirect targets can be overridden via `loginPath` and
   `unauthorizedPath` props.
   ---------------------------------------------------------------------- */

export interface RoleGuardProps {
  allow: readonly Role[];
  children: ReactNode;
  /** Override the default login redirect target. */
  loginPath?: string;
  /** Override the default unauthorized redirect target. */
  unauthorizedPath?: string;
  /** Optional skeleton to render while hydrating. */
  fallback?: ReactNode;
  className?: string;
}

const DEFAULT_LOGIN = "/login";
const DEFAULT_UNAUTHORIZED = "/unauthorized";

function GuardSkeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[60vh] flex-col gap-4 px-4 py-12 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function RoleGuard({
  allow,
  children,
  loginPath = DEFAULT_LOGIN,
  unauthorizedPath = DEFAULT_UNAUTHORIZED,
  fallback,
  className,
}: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useAuth();

  // Build the redirect path once per render. We append the current
  // pathname + search so the user lands back on the original URL after
  // logging in.
  const redirectTo = (() => {
    if (typeof window === "undefined") return loginPath;
    const full = pathname + window.location.search;
    if (!full || full === "/") return loginPath;
    return `${loginPath}?redirect=${encodeURIComponent(full)}`;
  })();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (user && !allow.includes(user.role)) {
      router.replace(unauthorizedPath);
    }
  }, [isHydrated, isAuthenticated, user, allow, redirectTo, unauthorizedPath, router]);

  // Rule 1: still hydrating — never redirect, just show a skeleton.
  if (!isHydrated) {
    return <>{fallback ?? <GuardSkeleton className={className} />}</>;
  }

  // The redirect effect is scheduled. Render the skeleton in the
  // intervening tick to avoid a flash of the wrong page.
  if (!isAuthenticated) {
    return <>{fallback ?? <GuardSkeleton className={className} />}</>;
  }

  if (user && !allow.includes(user.role)) {
    return <>{fallback ?? <GuardSkeleton className={className} />}</>;
  }

  return <>{children}</>;
}
