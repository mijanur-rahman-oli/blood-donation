/**
 * Tiny chart fallbacks.
 *
 * The admin dashboard spec calls for Recharts (LineChart + PieChart +
 * BarChart). Recharts is not in `package.json` yet, so these components
 * render the same data shape with hand-drawn SVG instead. The public
 * prop surface is the same as the Recharts components they replace, so
 * installing `recharts` later and swapping the imports does not touch
 * call sites.
 *
 * Components:
 *   - <LineChart data={...} dataKey xKey yKey height />
 *   - <PieChart data={...} nameKey valueKey colors height />
 *   - <BarChart data={...} dataKey nameKey height />   (horizontal bars)
 */

import { useMemo } from "react";

import { cn } from "@/lib/utils";

/* ====================================================================
   LineChart (SVG)
   ==================================================================== */
export interface LineChartDatum {
  [key: string]: string | number;
}

export interface LineChartProps {
  data: LineChartDatum[];
  dataKey: string;
  xKey: string;
  height?: number;
  yLabel?: string;
  className?: string;
}

export function LineChart({
  data,
  dataKey,
  xKey,
  height = 220,
  yLabel,
  className,
}: LineChartProps) {
  const { path, points, maxX, maxY, ticksX, ticksY } = useMemo(() => {
    const width = 600;
    const padding = { top: 16, right: 16, bottom: 28, left: 36 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    if (data.length === 0) {
      return { path: "", points: [], maxX: 0, maxY: 0, ticksX: [], ticksY: [] };
    }

    const maxValue = Math.max(
      1,
      ...data.map((d) => Number(d[dataKey] ?? 0)),
    );
    const stepX = data.length > 1 ? innerWidth / (data.length - 1) : 0;

    const computedPoints = data.map((d, idx) => {
      const x = padding.left + idx * stepX;
      const y =
        padding.top +
        innerHeight -
        (Number(d[dataKey] ?? 0) / maxValue) * innerHeight;
      return { x, y, label: String(d[xKey] ?? ""), value: Number(d[dataKey] ?? 0) };
    });

    const pathString =
      "M " +
      computedPoints
        .map((p, i) => `${i === 0 ? "" : "L "}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    const yTickCount = 4;
    const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
      const v = (maxValue / yTickCount) * i;
      const y = padding.top + innerHeight - (v / maxValue) * innerHeight;
      return { y, value: v };
    });

    const xTickStep = Math.max(1, Math.floor(data.length / 5));
    const xTicks = computedPoints
      .map((p, i) => ({ ...p, idx: i }))
      .filter((_, i) => i % xTickStep === 0 || i === computedPoints.length - 1);

    return {
      path: pathString,
      points: computedPoints,
      maxX: width,
      maxY: height,
      ticksX: xTicks,
      ticksY: yTicks,
    };
  }, [data, dataKey, xKey, height]);

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${maxX} ${maxY}`}
        width="100%"
        height={height}
        role="img"
        aria-label={yLabel ?? "Line chart"}
      >
        {ticksY.map((t, i) => (
          <g key={`y-${i}`}>
            <line
              x1={36}
              x2={maxX - 16}
              y1={t.y}
              y2={t.y}
              stroke="hsl(var(--border))"
              strokeDasharray="2 3"
            />
            <text
              x={4}
              y={t.y + 3}
              fontSize="10"
              fill="hsl(var(--muted-foreground))"
            >
              {Math.round(t.value)}
            </text>
          </g>
        ))}
        {ticksX.map((t, i) => (
          <text
            key={`x-${i}`}
            x={t.x}
            y={maxY - 6}
            fontSize="10"
            textAnchor="middle"
            fill="hsl(var(--muted-foreground))"
          >
            {t.label}
          </text>
        ))}
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} />
        {points.map((p, i) => (
          <circle
            key={`p-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill="hsl(var(--primary))"
          />
        ))}
      </svg>
    </div>
  );
}

/* ====================================================================
   PieChart (SVG)
   ==================================================================== */
export interface PieChartDatum {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: PieChartDatum[];
  height?: number;
  className?: string;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
  "hsl(var(--accent-foreground))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--secondary-foreground))",
];

export function PieChart({ data, height = 220, className }: PieChartProps) {
  const { slices, total } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
    const cx = 110;
    const cy = height / 2;
    const r = Math.min(cx, cy) - 8;
    let cursor = -Math.PI / 2;
    const slices = data.map((d, i) => {
      const fraction = d.value / total;
      const start = cursor;
      const end = cursor + fraction * Math.PI * 2;
      cursor = end;
      const largeArc = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const path =
        d.value === 0
          ? ""
          : fraction === 1
          ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`
          : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return {
        name: d.name,
        value: d.value,
        fraction,
        path,
        color: PIE_COLORS[i % PIE_COLORS.length]!,
      };
    });
    return { slices, total };
  }, [data, height]);

  return (
    <div className={cn("flex flex-col items-stretch gap-4 sm:flex-row sm:items-center", className)}>
      <svg
        viewBox={`0 0 220 ${height}`}
        width={220}
        height={height}
        role="img"
        aria-label="Pie chart"
        className="shrink-0"
      >
        {slices.map((slice, i) => (
          <path key={`slice-${i}`} d={slice.path} fill={slice.color} />
        ))}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ background: slice.color }}
            />
            <span className="text-foreground">{slice.name}</span>
            <span className="text-muted-foreground">
              {slice.value} · {Math.round(slice.fraction * 100)}%
            </span>
          </li>
        ))}
        {total === 0 ? (
          <li className="text-xs text-muted-foreground">No data</li>
        ) : null}
      </ul>
    </div>
  );
}

/* ====================================================================
   BarChart (SVG, horizontal)
   ====================================================================
   Used by the admin dashboard to summarise headline counts side by
   side. Public surface mirrors what a Recharts <BarChart layout="vertical"
   /> would expose: data is an array of `{ name, value }` records and
   the chart draws one bar per record.
   ==================================================================== */
export interface BarChartDatum {
  name: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDatum[];
  height?: number;
  className?: string;
  /** Optional explicit color for every bar. */
  color?: string;
  /** Bar value formatter (default: locale string). */
  formatValue?: (value: number) => string;
}

export function BarChart({
  data,
  height = 220,
  className,
  color = "hsl(var(--primary))",
  formatValue,
}: BarChartProps) {
  const rows = useMemo(() => {
    if (data.length === 0) return [] as Array<BarChartDatum & { pct: number }>;
    const max = Math.max(1, ...data.map((d) => d.value));
    return data.map((d) => ({ ...d, pct: d.value / max }));
  }, [data]);

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-sm text-muted-foreground",
          className,
        )}
        style={{ height }}
        role="img"
        aria-label="Bar chart"
      >
        No data
      </div>
    );
  }

  const labelWidth = 88;
  const valueWidth = 60;
  const trackWidth = 320;
  const totalWidth = labelWidth + trackWidth + valueWidth + 8;
  const rowHeight = Math.max(20, Math.floor(height / Math.max(1, rows.length)));
  const totalHeight = rowHeight * rows.length;
  const trackHeight = Math.max(8, rowHeight - 12);

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        width="100%"
        height={totalHeight}
        role="img"
        aria-label="Bar chart"
      >
        {rows.map((row, i) => {
          const y = i * rowHeight;
          const textY = y + rowHeight / 2;
          const barX = labelWidth;
          const barW = Math.max(2, trackWidth * row.pct);
          const barY = y + (rowHeight - trackHeight) / 2;
          const valueX = labelWidth + trackWidth + 8;
          return (
            <g key={row.name}>
              <text
                x={labelWidth - 8}
                y={textY}
                fontSize="11"
                textAnchor="end"
                dominantBaseline="middle"
                fill="hsl(var(--muted-foreground))"
              >
                {row.name}
              </text>
              <rect
                x={barX}
                y={barY}
                width={trackWidth}
                height={trackHeight}
                rx={3}
                fill="hsl(var(--muted))"
              />
              <rect
                x={barX}
                y={barY}
                width={barW}
                height={trackHeight}
                rx={3}
                fill={color}
              />
              <text
                x={valueX}
                y={textY}
                fontSize="11"
                dominantBaseline="middle"
                fill="hsl(var(--foreground))"
              >
                {formatValue ? formatValue(row.value) : row.value.toLocaleString()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
