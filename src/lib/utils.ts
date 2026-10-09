/**
 * Minimal local equivalent of `clsx`'s `ClassValue` so we do not depend
 * on the `clsx` runtime package. Accepts strings, numbers, booleans,
 * null, undefined, arrays, and dictionaries.
 */
export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassDictionary
  | ClassArray;

interface ClassDictionary {
  [id: string]: boolean | undefined | null | string | number;
}

interface ClassArray extends Array<ClassValue> {}

/**
 * Merge Tailwind class names safely.
 *
 * Implemented inline (no `clsx` / `tailwind-merge` runtime dependency) so
 * the helper works even before shadcn dependencies are added. The behavior
 * matches the common shadcn `cn` helper:
 *   - Supports arrays, objects, and falsy values via a tiny `clsx`-like
 *     normalizer.
 *   - Resolves the **last** conflicting Tailwind utility so e.g.
 *     `cn("px-2", "px-4")` correctly resolves to `"px-4"`.
 *
 * @example
 *   cn("px-2 py-1", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]): string {
  const classes = normalize(inputs);

  // Group by "base key" so later utilities override earlier ones for the
  // same Tailwind class prefix (e.g. `p-2` + `p-4` -> `p-4`).
  const groups = new Map<string, string[]>();
  const order: string[] = [];

  for (const cls of classes) {
    const key = baseKey(cls);
    if (!groups.has(key)) {
      order.push(key);
      groups.set(key, []);
    }
    groups.get(key)!.push(cls);
  }

  return order.map((k) => groups.get(k)!.join(" ")).join(" ");
}

/* ----------------------------------------------------------------------
   clsx-compatible normalizer (string | number | boolean | undefined | null
   | ClassDictionary | ClassArray). Avoids the `clsx` runtime dep.
   ---------------------------------------------------------------------- */
function normalize(inputs: ClassValue[]): string[] {
  const out: string[] = [];
  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === "string" || typeof input === "number") {
      out.push(String(input));
    } else if (Array.isArray(input)) {
      out.push(...normalize(input as ClassValue[]));
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) out.push(key);
      }
    }
  }
  return out;
}

/**
 * Derive the "base" Tailwind key for ordering / deduping. We split each
 * utility on whitespace and `-`, take the leading prefix, and keep the
 * first numeric/bracket/value segment so e.g. `px-2` and `px-4` share
 * a key while `bg-red-500` and `text-red-500` do not.
 */
function baseKey(cls: string): string {
  const parts = cls.split("-");
  if (parts.length === 1) return parts[0]!;
  return parts.slice(0, 2).join("-");
}

/**
 * Sleep helper for development-only flows (e.g. simulating latency in demos).
 * Do not use in production data paths.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format an ISO date string as a human-readable local date.
 * Returns "—" for null/undefined/invalid input.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format an ISO date string as a human-readable local date + time.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a number as BDT currency. Centralized so it can be swapped for
 * a real i18n formatter later.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "BDT",
): string {
  if (amount === null || amount === undefined || amount === "") return "—";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Truncate a string to a maximum length, adding an ellipsis if cut.
 */
export function truncate(text: string, max = 80): string {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Build a query-string from a plain object. Drops null/undefined/empty values.
 */
export function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    const str = String(value).trim();
    if (str.length === 0) continue;
    search.set(key, str);
  }
  const s = search.toString();
  return s.length > 0 ? `?${s}` : "";
}
