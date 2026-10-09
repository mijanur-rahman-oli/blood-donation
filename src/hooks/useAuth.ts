"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/lib/api/users";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

/* ----------------------------------------------------------------------
   useAuth
   ----------------------------------------------------------------------
   Single integration point between the Zustand `authStore` and TanStack
   Query. The store owns the canonical `user` state; the query is the
   transport that hydrates it. Components only read from the store so
   hydration mismatches are impossible.
   ---------------------------------------------------------------------- */

export const AUTH_ME_QUERY_KEY = ["auth", "me"] as const;

export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  clear: () => void;
}

export function useAuth(): UseAuthResult {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isLoadingStore = useAuthStore((s) => s.isLoading);
  const errorStore = useAuthStore((s) => s.error);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const hydrate = useAuthStore((s) => s.hydrate);

  const query = useQuery<User, Error>({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: getMe,
    enabled: false, // Hydration is driven by the store, not by mount.
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (!isHydrated && !isLoadingStore) {
      void hydrate();
    }
  }, [isHydrated, isLoadingStore, hydrate]);

  return {
    user,
    isAuthenticated: user !== null,
    isHydrated,
    isLoading: isLoadingStore || query.isFetching,
    error: errorStore,
    refresh: async () => {
      const next = await query.refetch();
      return next.data ?? null;
    },
    setUser,
    clear,
  };
}
