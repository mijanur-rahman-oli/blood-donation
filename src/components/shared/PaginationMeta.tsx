import { cn } from "@/lib/utils";
import type { PaginationMeta } from "@/types";

/* ----------------------------------------------------------------------
   PaginationMeta
   ----------------------------------------------------------------------
   Compact "Showing X–Y of Z [resource]" line rendered above every
   paginated list. Pure server-friendly component.
   ---------------------------------------------------------------------- */

export interface PaginationMetaProps {
  meta: PaginationMeta | undefined;
  /** Optional override for "resource" label (e.g. "users", "requests"). */
  resource?: string;
  className?: string;
}

export function PaginationMeta({
  meta,
  resource = "results",
  className,
}: PaginationMetaProps) {
  if (!meta) return null;
  const total = meta.total;
  if (total === 0) {
    return (
      <p
        className={cn(
          "text-xs text-muted-foreground",
          className,
        )}
        aria-live="polite"
      >
        No {resource} to display
      </p>
    );
  }
  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, total);
  return (
    <p
      className={cn("text-xs text-muted-foreground", className)}
      aria-live="polite"
    >
      Showing <span className="font-medium text-foreground">{start}</span>–
      <span className="font-medium text-foreground">{end}</span> of{" "}
      <span className="font-medium text-foreground">{total}</span> {resource}
    </p>
  );
}
