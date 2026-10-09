"use client";

import { create } from "zustand";

import { api, extractApiError } from "@/lib/axios";
import type { User } from "@/types";

/* ----------------------------------------------------------------------
   Auth store (Zustand)
   ----------------------------------------------------------------------
   Holds the minimal session info needed for role-aware UI:
     - `user`        : hydrated from /users/me on app boot
     - `isHydrated`  : false until the first /users/me attempt completes
                       (success or failure) so the UI can avoid hydration
                       mismatch on the server-rendered shell
     - `setUser`     : full `User` setter, used after `/users/me`
     - `setSessionUser`: partial setter (id+name+email+role) used by the
                       /api/auth/* responses that don't ship the full
                       User document. Fills sensible defaults for the
                       missing fields.
     - `clear`       : clears the local store; the httpOnly cookies are
                       removed by the /api/auth/logout route handler
     - `hydrate`     : called from the root Providers on mount; performs
                       GET /users/me exactly once per app boot
   ---------------------------------------------------------------------- */

interface AuthState {
  user: User | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSessionUser: (input: { id: string; name: string; email: string; role: User["role"] }) => void;
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
      const res = await api.get<{ success: true; data: User }>("/users/me");
      set({
        user: res.data.data,
        isHydrated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // 401 is the expected unauthenticated case — silent, no error toast.
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      set({
        user: null,
        isHydrated: true,
        isLoading: false,
        error: status === 401 ? null : extractApiError(error),
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
