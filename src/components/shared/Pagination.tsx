"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

import { usePagination } from "@/hooks/usePagination";

/* ----------------------------------------------------------------------
   Pagination
   ----------------------------------------------------------------------
   URL-synced via `?page` and `?limit` (see usePagination). Renders
   previous/next chevrons plus a windowed list of page numbers with
   ellipses for large ranges. Honors PROJECT.md -> "URL State
   Synchronization": refresh preserves the page.
   ---------------------------------------------------------------------- */

export interface PaginationProps {
  /** Total number of records (used to compute totalPages when totalPages
   *  is not provided by the caller). */
  total: number;
  /** Optional override for the total page count. */
  totalPages?: number;
  /** Number of sibling pages to show around the current page. */
  siblingCount?: number;
  className?: string;
}

function range(start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = start; i <= end; i += 1) out.push(i);
  return out;
}

function buildPageList(
  current: number,
  totalPages: number,
  siblingCount: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 1) return [1];
  const totalSlots = siblingCount * 2 + 5; // first + last + current + 2 ellipsis + siblings
  if (totalPages <= totalSlots) {
    return range(1, totalPages);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const pages: Array<number | "ellipsis"> = [1];
  if (showLeftEllipsis) pages.push("ellipsis");
  pages.push(...range(leftSibling, rightSibling));
  if (showRightEllipsis) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

export function Pagination({
  total,
  totalPages,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const { page, limit, setPage } = usePagination();

  const computedTotalPages = useMemo(() => {
    if (typeof totalPages === "number" && totalPages > 0) return totalPages;
    if (total > 0 && limit > 0) return Math.max(1, Math.ceil(total / limit));
    return 1;
  }, [total, limit, totalPages]);

  if (computedTotalPages <= 1) return null;

  const pages = buildPageList(page, computedTotalPages, siblingCount);
  const isFirst = page <= 1;
  const isLast = page >= computedTotalPages;

  const buttonBase =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-background px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{computedTotalPages}</span>
        {" "}· {total} {total === 1 ? "result" : "results"}
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={isFirst}
            className={buttonBase}
            aria-label="Previous page"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </li>

        {pages.map((p, idx) =>
          p === "ellipsis" ? (
            <li
              key={`ellipsis-${idx}`}
              className="px-2 text-sm text-muted-foreground"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => setPage(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  buttonBase,
                  p === page && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={isLast}
            className={buttonBase}
            aria-label="Next page"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </li>
      </ul>
    </nav>
  );
}
