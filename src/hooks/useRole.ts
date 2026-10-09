"use client";

import { useMemo } from "react";

import { useAuthStore } from "@/store/authStore";
import type { Role } from "@/types";

/* ----------------------------------------------------------------------
   useRole
   ----------------------------------------------------------------------
   Thin convenience hook over `useAuthStore` that returns the current
   role plus a few boolean helpers. Components stay declarative and
   the hook handles the null case.
   ---------------------------------------------------------------------- */

export interface UseRoleResult {
  role: Role | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isAdmin: boolean;
  isDonor: boolean;
  isRequester: boolean;
}

export function useRole(): UseRoleResult {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  return useMemo<UseRoleResult>(() => {
    const role = user?.role ?? null;
    return {
      role,
      isAuthenticated: user !== null,
      isHydrated,
      isAdmin: role === "ADMIN",
      isDonor: role === "DONOR",
      isRequester: role === "REQUESTER",
    };
  }, [user, isHydrated]);
}
