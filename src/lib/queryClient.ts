import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton `QueryClient` used by the root `Providers` component.
 *
 * Defaults are tuned for an authenticated dashboard app:
 *   - `staleTime: 30s`   — list pages are considered fresh for 30 seconds
 *                          so navigating between pages does not refetch.
 *   - `retry: 1`         — one automatic retry on transient failures,
 *                          but never on 4xx errors (see `retryDelay` logic).
 *   - `refetchOnWindowFocus: false` — the backend already exposes manual
 *                          refresh controls; avoid surprise refetches when
 *                          the user returns to a tab.
 *   - `refetchOnReconnect: true`  — recover after a dropped connection.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Never retry 4xx — those are caller errors, not transient.
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
