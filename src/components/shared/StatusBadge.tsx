import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type {
  AssignmentStatus,
  PaymentStatus,
  RequestStatus,
  UserStatus,
} from "@/types";

/* ----------------------------------------------------------------------
   StatusBadge
   ----------------------------------------------------------------------
   Single source of truth for status styling across the app. Renders a
   small pill that pairs the canonical status label with the project's
   design-system color tokens (see tailwind.config.ts and globals.css).
   ---------------------------------------------------------------------- */

export type StatusVariant =
  | RequestStatus
  | AssignmentStatus
  | UserStatus
  | PaymentStatus
  | "DEFAULT";

interface VariantStyle {
  label: string;
  className: string;
}

const VARIANT_MAP: Record<string, VariantStyle> = {
  /* request status */
  PENDING: {
    label: "Pending",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  VERIFIED: {
    label: "Verified",
    className: "bg-info/10 text-info border-info/20",
  },
  MATCHING: {
    label: "Matching",
    className: "bg-info/10 text-info border-info/20",
  },
  ASSIGNED: {
    label: "Assigned",
    className: "bg-info/10 text-info border-info/20",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-success/10 text-success border-success/20",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },

  /* assignment status */
  ACCEPTED: {
    label: "Accepted",
    className: "bg-info/10 text-info border-info/20",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },

  /* user status */
  ACTIVE: {
    label: "Active",
    className: "bg-success/10 text-success border-success/20",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },

  /* payment status */
  PAID: {
    label: "Paid",
    className: "bg-success/10 text-success border-success/20",
  },
  FAILED: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  className?: string;
  children?: ReactNode;
}

export function StatusBadge({
  status,
  label,
  className,
  children,
}: StatusBadgeProps) {
  const variant = VARIANT_MAP[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variant.className,
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
      />
      {children ?? label ?? variant.label}
    </span>
  );
}
