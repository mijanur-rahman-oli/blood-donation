"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { toast as sonnerToast } from "sonner";

import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";

/* ----------------------------------------------------------------------
   Toast helper
   ----------------------------------------------------------------------
   Re-export sonner's `toast` so the rest of the app can `import { toast }
   from "@/app/providers"` and remain provider-agnostic. The actual
   <Toaster /> is mounted once at the root in `src/app/layout.tsx`; this
   file only exposes the typed call helpers.
   ---------------------------------------------------------------------- */

export const toast = {
  success(title: string, description?: string) {
    if (description) sonnerToast.success(title, { description });
    else sonnerToast.success(title);
  },
  error(title: string, description?: string) {
    if (description) sonnerToast.error(title, { description });
    else sonnerToast.error(title);
  },
  info(title: string, description?: string) {
    if (description) sonnerToast.info(title, { description });
    else sonnerToast.info(title);
  },
  warning(title: string, description?: string) {
    if (description) sonnerToast.warning(title, { description });
    else sonnerToast.warning(title);
  },
  raw: sonnerToast,
};

/* ----------------------------------------------------------------------
   Providers
   ----------------------------------------------------------------------
   Root client provider tree:
     1. QueryClientProvider  — wires the singleton query client so every
        useQuery / useMutation in the app shares its cache.
     2. Auth hydration       — on mount, calls `useAuthStore.hydrate()`
        exactly once. This restores the session from the httpOnly
        `accessToken` cookie via /api/auth/me and MUST complete before
        the route guard reads `isHydrated` to decide whether to render
        a skeleton or a redirect. The Zustand store has an internal
        guard against duplicate hydrations, so it is also safe to call
        `hydrate()` again after a full-page navigation.
   The Sonner <Toaster /> is mounted by the root layout (not here) so
   that the same surface is shared by every route group.
   ---------------------------------------------------------------------- */

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Subscribe to the hydrate action. `useAuthStore.getState().hydrate`
  // is also fine here, but subscribing keeps the same idiom as the
  // auth-store tests.
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    // Fire and forget. The store flips `isHydrated` to true once the
    // request resolves (success OR failure), so callers will always
    // converge.
    void hydrate();
  }, [hydrate]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
