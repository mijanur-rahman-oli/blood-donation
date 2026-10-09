"use client";

import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster as SonnerToaster } from "sonner";

import { queryClient } from "@/lib/queryClient";
import { useAuthStore } from "@/store/authStore";

/* ----------------------------------------------------------------------
   Providers
   ----------------------------------------------------------------------
   Root client provider tree:
     1. QueryClientProvider  — wires the singleton query client so every
        useQuery / useMutation in the app shares its cache.
     2. Sonner <Toaster />   — toast surface for every mutation
        success/error across the app.
     3. Auth hydration       — on mount, calls `useAuthStore().hydrate()`
        exactly once so the Zustand store is populated before the
        Navbar/UserMenu render.
   ---------------------------------------------------------------------- */

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <SonnerToaster richColors position="top-right" closeButton duration={4000} />
    </QueryClientProvider>
  );
}
