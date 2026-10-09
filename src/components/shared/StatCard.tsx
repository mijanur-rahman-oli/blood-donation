import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   StatCard
   ----------------------------------------------------------------------
   Compact KPI tile used by dashboards. Renders an icon, a label, the
   value, and an optional trend indicator (delta + direction).
   ---------------------------------------------------------------------- */

export type StatTone = "default" | "primary" | "success" | "warning" | "info" | "destructive";

const TONE_MAP: Record<StatTone, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

export interface StatCardProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  /** Optional caption beneath the value. */
  description?: ReactNode;
  /** Numeric delta; renders alongside the trend arrow. */
  trend?: number;
  /** If true, a positive trend is bad (red). Default: positive = good. */
  invertTrend?: boolean;
  tone?: StatTone;
  className?: string;
}

export function StatCard({
  icon,
  label,
  value,
  description,
  trend,
  invertTrend = false,
  tone = "default",
  className,
}: StatCardProps) {
  const showTrend = typeof trend === "number" && Number.isFinite(trend);
  const trendDirection =
    trend === undefined ? "flat" : trend > 0 ? "up" : trend < 0 ? "down" : "flat";
  const trendIsGood = invertTrend ? trendDirection === "down" : trendDirection === "up";
  const trendClass = trendDirection === "flat"
    ? "text-muted-foreground"
    : trendIsGood
    ? "text-success"
    : "text-destructive";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              TONE_MAP[tone],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>

      {showTrend ? (
        <div className={cn("mt-4 flex items-center gap-1 text-xs font-medium", trendClass)}>
          <span aria-hidden>
            {trendDirection === "up" ? "▲" : trendDirection === "down" ? "▼" : "•"}
          </span>
          <span>
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      ) : null}
    </div>
  );
}
