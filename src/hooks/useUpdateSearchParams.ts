"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ----------------------------------------------------------------------
   useUpdateSearchParams
   ----------------------------------------------------------------------
   A small wrapper around `useRouter` + `useSearchParams` that lets
   components merge, replace, or remove URL query parameters without
   clobbering unrelated state.

   Conventions (per PROJECT.md -> "URL State Synchronization"):
     - Always uses `router.replace(...)` (never `pushState` directly).
     - `scroll: false` so filter changes do not jump the viewport.
     - Empty string / null / undefined values are removed from the URL.
   ---------------------------------------------------------------------- */

export type SearchParamPrimitive = string | number | boolean | null | undefined;

export interface UpdateSearchParamsOptions {
  /** Replace the entire query string instead of merging. */
  replace?: boolean;
  /** Scroll position to maintain after navigation. Defaults to `false`. */
  scroll?: boolean;
  /** Path to navigate to; defaults to the current pathname. */
  pathname?: string;
}

export interface UseUpdateSearchParamsResult {
  /** Current parsed search params (read-only snapshot). */
  searchParams: URLSearchParams;
  /** Current pathname. */
  pathname: string;
  /**
   * Merge updates into the current URL.
   *   - `null` / `undefined` / `""` removes the key.
   *   - Numbers/booleans are stringified.
   */
  update: (
    updates: Record<string, SearchParamPrimitive>,
    options?: UpdateSearchParamsOptions,
  ) => void;
  /** Remove one or more keys from the URL. */
  remove: (keys: string | string[], options?: UpdateSearchParamsOptions) => void;
  /** Reset the URL to the current pathname with no query string. */
  reset: (options?: UpdateSearchParamsOptions) => void;
  /** Build a stable `?a=1&b=2` string from the current params. */
  toString: () => string;
}

function stringify(value: SearchParamPrimitive): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function useUpdateSearchParams(): UseUpdateSearchParamsResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const stableParams = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  const navigate = useCallback(
    (next: URLSearchParams, options?: UpdateSearchParamsOptions) => {
      const target = options?.pathname ?? pathname;
      const qs = next.toString();
      const url = qs.length > 0 ? `${target}?${qs}` : target;
      router.replace(url, { scroll: options?.scroll ?? false });
    },
    [pathname, router],
  );

  const update = useCallback(
    (
      updates: Record<string, SearchParamPrimitive>,
      options?: UpdateSearchParamsOptions,
    ) => {
      const next = options?.replace
        ? new URLSearchParams()
        : new URLSearchParams(stableParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        const formatted = stringify(value);
        if (formatted === "") {
          next.delete(key);
        } else {
          next.set(key, formatted);
        }
      }

      navigate(next, options);
    },
    [navigate, stableParams],
  );

  const remove = useCallback(
    (keys: string | string[], options?: UpdateSearchParamsOptions) => {
      const list = Array.isArray(keys) ? keys : [keys];
      const next = new URLSearchParams(stableParams.toString());
      for (const key of list) next.delete(key);
      navigate(next, options);
    },
    [navigate, stableParams],
  );

  const reset = useCallback(
    (options?: UpdateSearchParamsOptions) => {
      navigate(new URLSearchParams(), options);
    },
    [navigate],
  );

  const toString = useCallback(() => stableParams.toString(), [stableParams]);

  return {
    searchParams: stableParams,
    pathname,
    update,
    remove,
    reset,
    toString,
  };
}
