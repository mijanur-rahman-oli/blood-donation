"use client";

import {
  forwardRef,
  type Key,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";

import { EmptyState } from "./EmptyState";

/* ----------------------------------------------------------------------
   DataTable
   ----------------------------------------------------------------------
   Generic, URL-synced table for any list page.

   Features:
     - Strictly typed columns with a stable `accessor` key.
     - Optional `sortable` columns write `?sortBy=<accessor>&sortOrder=asc|desc`.
     - Mobile (< md): collapses each row into a stacked card with the
       column header rendered as a small label.
     - Empty state: pass an `emptyState` element OR rely on the default.
     - Loading state: `isLoading` renders 5 skeleton rows.
     - Row click handler + a stable React key per row.

   Sorting convention (per PROJECT.md -> "URL State Synchronization"):
     - Click an unsorted column  -> sortBy=<col>, sortOrder=asc
     - Click a sorted asc column -> sortOrder=desc
     - Click a sorted desc column -> sortBy removed, sortOrder removed
   ---------------------------------------------------------------------- */

export interface DataTableColumn<T> {
  /** Stable, URL-safe key. Also used as the React key + sortBy value. */
  accessor: keyof T & string;
  /** Header label rendered in the <th> and as the card label on mobile. */
  header: string;
  /** Optional explicit cell renderer. Defaults to `String(row[accessor])`. */
  cell?: (row: T) => ReactNode;
  /** When true, clicking the header toggles sort and writes the URL. */
  sortable?: boolean;
  /** Extra Tailwind classes applied to the <td> / mobile card value. */
  className?: string;
  /** Tailwind classes applied to the header <th>. */
  headerClassName?: string;
  /** Hide this column on mobile (rendered as `hidden md:table-cell`). */
  hideOnMobile?: boolean;
  /** Optional align override for the cell content. */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  /** Compute the React key for a row. Defaults to a property called `id`. */
  rowKey?: (row: T, index: number) => Key;
  /** Optional click handler applied to the whole row. */
  onRowClick?: (row: T) => void;
  /** Optional empty-state node. Falls back to a default EmptyState. */
  emptyState?: ReactNode;
  /** Number of skeleton rows to render while loading. */
  skeletonRows?: number;
  className?: string;
  /** Optional caption rendered above the table. */
  caption?: ReactNode;
  /** Optional sort URL param names. */
  sortByParam?: string;
  sortOrderParam?: string;
  /** Default sort if the URL has none. */
  defaultSort?: { sortBy: string; sortOrder: "asc" | "desc" };
}

const DEFAULT_SORT_BY = "sortBy";
const DEFAULT_SORT_ORDER = "sortOrder";

function alignClass(align: "left" | "center" | "right" | undefined): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    case "left":
    default:
      return "text-left";
  }
}

function nextSort(
  currentSortBy: string | null,
  currentSortOrder: "asc" | "desc" | null,
  clickedAccessor: string,
): { sortBy: string | null; sortOrder: "asc" | "desc" | null } {
  if (currentSortBy !== clickedAccessor) {
    return { sortBy: clickedAccessor, sortOrder: "asc" };
  }
  if (currentSortOrder === "asc") {
    return { sortBy: clickedAccessor, sortOrder: "desc" };
  }
  if (currentSortOrder === "desc") {
    return { sortBy: null, sortOrder: null };
  }
  return { sortBy: clickedAccessor, sortOrder: "asc" };
}

function defaultKey<T extends { id?: Key }>(row: T, index: number): Key {
  if (row.id !== undefined && row.id !== null) return row.id;
  return index;
}

function DataTableInner<T>(
  props: DataTableProps<T>,
  _ref: React.ForwardedRef<HTMLTableElement>,
) {
  const {
    columns,
    data,
    isLoading = false,
    rowKey = defaultKey as (row: T, index: number) => Key,
    onRowClick,
    emptyState,
    skeletonRows = 5,
    className,
    caption,
    sortByParam = DEFAULT_SORT_BY,
    sortOrderParam = DEFAULT_SORT_ORDER,
    defaultSort,
  } = props;

  const { searchParams, update } = useUpdateSearchParams();

  const urlSortBy = searchParams.get(sortByParam);
  const urlSortOrder = searchParams.get(sortOrderParam);
  const activeSortBy = urlSortBy ?? defaultSort?.sortBy ?? null;
  const activeSortOrder =
    (urlSortOrder as "asc" | "desc" | null) ?? defaultSort?.sortOrder ?? null;

  function handleSort(accessor: string) {
    const next = nextSort(activeSortBy, activeSortOrder, accessor);
    update({
      [sortByParam]: next.sortBy,
      [sortOrderParam]: next.sortOrder,
      page: 1,
    });
  }

  function renderCell(row: T, column: DataTableColumn<T>): ReactNode {
    if (column.cell) return column.cell(row);
    const value = (row as Record<string, unknown>)[column.accessor];
    if (value === null || value === undefined) return "—";
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    return JSON.stringify(value);
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card", className)}>
        {caption ? <div className="border-b border-border p-4">{caption}</div> : null}
        {emptyState ?? (
          <EmptyState
            className="border-0"
            title="No results"
            description="Try adjusting your filters or search query."
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border bg-card shadow-sm", className)}>
      {caption ? <div className="border-b border-border p-4">{caption}</div> : null}

      {/* Desktop table (md+) */}
      <div className="hidden overflow-x-auto md:block">
        <table ref={_ref} className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              {columns.map((col) => {
                const isSorted = activeSortBy === col.accessor;
                const sortDir = isSorted ? activeSortOrder : null;
                return (
                  <th
                    key={col.accessor}
                    scope="col"
                    className={cn(
                      "px-4 py-3 font-semibold",
                      alignClass(col.align),
                      col.hideOnMobile && "hidden md:table-cell",
                      col.headerClassName,
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.accessor)}
                        className="inline-flex items-center gap-1 rounded-sm text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                        aria-label={`Sort by ${col.header}`}
                        aria-sort={
                          sortDir === "asc"
                            ? "ascending"
                            : sortDir === "desc"
                            ? "descending"
                            : "none"
                        }
                      >
                        {col.header}
                        <span aria-hidden className="text-[10px]">
                          {sortDir === "asc" ? "▲" : sortDir === "desc" ? "▼" : "↕"}
                        </span>
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: skeletonRows }).map((_, rowIdx) => (
                  <tr
                    key={`skeleton-${rowIdx}`}
                    className="border-b border-border last:border-b-0"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.accessor}
                        className={cn(
                          "px-4 py-3",
                          alignClass(col.align),
                          col.hideOnMobile && "hidden md:table-cell",
                          col.className,
                        )}
                      >
                        <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row, rowIdx) => {
                  const key = rowKey(row, rowIdx);
                  return (
                    <tr
                      key={key}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        "border-b border-border last:border-b-0 transition-colors",
                        onRowClick && "cursor-pointer hover:bg-muted/50",
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.accessor}
                          className={cn(
                            "px-4 py-3 align-middle text-foreground",
                            alignClass(col.align),
                            col.hideOnMobile && "hidden md:table-cell",
                            col.className,
                          )}
                        >
                          {renderCell(row, col)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <ul className="divide-y divide-border md:hidden">
        {isLoading
          ? Array.from({ length: skeletonRows }).map((_, rowIdx) => (
              <li key={`mobile-skeleton-${rowIdx}`} className="space-y-2 p-4">
                {columns.slice(0, 3).map((col) => (
                  <div key={col.accessor} className="space-y-1">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </li>
            ))
          : data.map((row, rowIdx) => {
              const key = rowKey(row, rowIdx);
              return (
                <li
                  key={key}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "space-y-2 p-4",
                    onRowClick && "cursor-pointer hover:bg-muted/50",
                  )}
                >
                  {columns
                    .filter((col) => !col.hideOnMobile)
                    .map((col) => (
                      <div
                        key={col.accessor}
                        className={cn(
                          "flex items-start justify-between gap-3",
                          col.className,
                        )}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {col.header}
                        </span>
                        <span className="text-right text-sm text-foreground">
                          {renderCell(row, col)}
                        </span>
                      </div>
                    ))}
                </li>
              );
            })}
      </ul>
    </div>
  );
}

/**
 * Forwarded generic component. The ref points at the inner <table>.
 */
export const DataTable = forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLTableElement> },
) => ReturnType<typeof DataTableInner>;
