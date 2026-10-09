"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/types";

/* ----------------------------------------------------------------------
   RoleGuard
   ----------------------------------------------------------------------
   Client-side guard for role-restricted routes. Used by the per-area
   layouts (`/admin/layout.tsx`, `/dashboard/layout.tsx`, `/donor/layout.tsx`).
   Behaviour:
     - Wait for `useAuth().isHydrated` (Zustand store finished /users/me)
     - If not authenticated → /login?redirect=<original>
     - If authenticated but role not in `allow` → /unauthorized
     - Otherwise render children
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
        "container-app flex min-h-[60vh] flex-col gap-4 py-12",
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
  const { user, isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      const current =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      const redirect = current && current !== "/" ? `?redirect=${encodeURIComponent(current)}` : "";
      router.replace(`${loginPath}${redirect}`);
      return;
    }

    if (user && !allow.includes(user.role)) {
      router.replace(unauthorizedPath);
    }
  }, [isHydrated, isAuthenticated, user, allow, loginPath, unauthorizedPath, router]);

  if (!isHydrated) {
    return fallback ?? <GuardSkeleton className={className} />;
  }

  if (!isAuthenticated) {
    return fallback ?? <GuardSkeleton className={className} />;
  }

  if (user && !allow.includes(user.role)) {
    return fallback ?? <GuardSkeleton className={className} />;
  }

  return <>{children}</>;
}
