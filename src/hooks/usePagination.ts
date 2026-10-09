"use client";

import { useCallback, useMemo } from "react";

import { DEFAULT_LIMIT, DEFAULT_PAGE } from "@/lib/constants";
import type { PaginationMeta } from "@/types";

import { useUpdateSearchParams } from "./useUpdateSearchParams";

/* ----------------------------------------------------------------------
   usePagination
   ----------------------------------------------------------------------
   Reads `?page` and `?limit` from the URL and returns helpers to update
   them. URL is the single source of truth so refreshing the page
   preserves the table position (per PROJECT.md -> "URL State
   Synchronization").
   ---------------------------------------------------------------------- */

export interface UsePaginationResult {
  page: number;
  limit: number;
  meta: PaginationMeta;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  resetPagination: () => void;
}

function parseInt32(value: string | null, fallback: number): number {
  if (value === null || value === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function usePagination(
  fallbackMeta: Partial<PaginationMeta> = {},
): UsePaginationResult {
  const { searchParams, update } = useUpdateSearchParams();

  const page = parseInt32(searchParams.get("page"), DEFAULT_PAGE);
  const limit = parseInt32(searchParams.get("limit"), DEFAULT_LIMIT);

  const meta: PaginationMeta = useMemo(
    () => ({
      page,
      limit,
      total: fallbackMeta.total ?? 0,
      totalPages: fallbackMeta.totalPages ?? 1,
    }),
    [page, limit, fallbackMeta.total, fallbackMeta.totalPages],
  );

  const setPage = useCallback(
    (next: number) => {
      const safe = Number.isFinite(next) && next > 0 ? Math.floor(next) : 1;
      update({ page: safe === 1 ? null : safe, limit });
    },
    [limit, update],
  );

  const setLimit = useCallback(
    (next: number) => {
      const safe = Number.isFinite(next) && next > 0 ? Math.floor(next) : limit;
      update({ limit: safe === DEFAULT_LIMIT ? null : safe, page: 1 });
    },
    [limit, update],
  );

  const nextPage = useCallback(() => {
    if (meta.totalPages > 0 && page < meta.totalPages) setPage(page + 1);
  }, [meta.totalPages, page, setPage]);

  const prevPage = useCallback(() => {
    if (page > 1) setPage(page - 1);
  }, [page, setPage]);

  const resetPagination = useCallback(() => {
    update({ page: null, limit: null });
  }, [update]);

  return { page, limit, meta, setPage, setLimit, nextPage, prevPage, resetPagination };
}
