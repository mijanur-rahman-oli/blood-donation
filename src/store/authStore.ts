"use client";

import { create } from "zustand";

import { extractApiError } from "@/lib/axios";
import type { User } from "@/types";

/* ----------------------------------------------------------------------
   Auth store (Zustand)
   ----------------------------------------------------------------------
   Holds the minimal session info needed for role-aware UI:
     - `user`        : hydrated from /api/auth/me on app boot
     - `isHydrated`  : false until the first /api/auth/me attempt
                       completes (success or failure). The UI MUST NOT
                       redirect based on auth state until this flips
                       to true — otherwise the very first render after
                       a page reload is treated as "signed out" and the
                       user is bounced to /login while their session
                       cookie is still perfectly valid.
     - `setUser`     : full `User` setter, used after /api/auth/me
     - `setSessionUser`: partial setter (id+name+email+role) used by
                       the /api/auth/login response that doesn't ship
                       the full User document. Fills sensible defaults
                       for the missing fields.
     - `clear`       : clears the local store; the httpOnly cookies are
                       removed by the /api/auth/logout route handler
     - `hydrate`     : called from the root Providers on mount; performs
                       GET /api/auth/me exactly once per app boot

   The /api/auth/me route is a same-origin Next.js route handler that
   reads the httpOnly `accessToken` cookie server-side, calls the
   backend `/users/me` with the Bearer token, and returns the user.
   We never expose the access token to client JavaScript.
   ---------------------------------------------------------------------- */

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSessionUser: (input: {
    id: string;
    name: string;
    email: string;
    role: User["role"];
  }) => void;
  clear: () => void;
  hydrate: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  isHydrated: false,
  isLoading: false,
  error: null,
};

interface AuthMeEnvelope {
  success: boolean;
  message?: string;
  data?: User | null;
}

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  setUser: (user) =>
    set({
      user,
      isHydrated: true,
      isLoading: false,
      error: null,
    }),

  setSessionUser: (input) => {
    const now = new Date().toISOString();
    const next: User = {
      id: input.id,
      name: input.name,
      email: input.email,
      role: input.role,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    set({
      user: next,
      isHydrated: true,
      isLoading: false,
      error: null,
    });
  },

  clear: () =>
    set({
      user: null,
      isHydrated: true,
      isLoading: false,
      error: null,
    }),

  hydrate: async () => {
    // Avoid duplicate hydrations if multiple components call this.
    const current = useAuthStore.getState();
    if (current.isLoading || current.isHydrated) return;

    set({ isLoading: true, error: null });

    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { accept: "application/json" },
      });

      if (res.status === 401 || res.status === 404) {
        set({ user: null, isHydrated: true, isLoading: false, error: null });
        return;
      }

      if (!res.ok) {
        set({
          user: null,
          isHydrated: true,
          isLoading: false,
          error: `Failed to restore session (${res.status})`,
        });
        return;
      }

      const payload = (await res.json().catch(() => null)) as
        | AuthMeEnvelope
        | null;

      if (!payload || payload.success !== true || !payload.data) {
        set({ user: null, isHydrated: true, isLoading: false, error: null });
        return;
      }

      set({
        user: payload.data,
        isHydrated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Network/parse failure: still flip isHydrated to true so the UI
      // can settle on the unauthenticated state instead of an infinite
      // loading screen.
      set({
        user: null,
        isHydrated: true,
        isLoading: false,
        error: extractApiError(error, "Failed to restore session"),
      });
    }
  },
}));

/* ----------------------------------------------------------------------
   Convenience selectors
   ----------------------------------------------------------------------
   Keep component subscriptions narrow so unrelated state changes do not
   re-render the entire tree.
   ---------------------------------------------------------------------- */

export const selectUser = (s: AuthStore) => s.user;
export const selectIsHydrated = (s: AuthStore) => s.isHydrated;
export const selectIsAuthenticated = (s: AuthStore) => s.user !== null;
export const selectRole = (s: AuthStore) => s.user?.role ?? null;
