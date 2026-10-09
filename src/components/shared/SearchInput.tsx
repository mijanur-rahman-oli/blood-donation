"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { useDebounce } from "@/hooks/useDebounce";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";

/* ----------------------------------------------------------------------
   SearchInput
   ----------------------------------------------------------------------
   Debounced (300 ms by default) text input that writes `?q=<value>` to
   the URL via `useUpdateSearchParams`. URL is the single source of
   truth: the local input value is initialised from the URL on mount
 * and re-synced whenever the URL `q` changes externally (e.g. when a
 * "clear filters" button resets the search).
   ---------------------------------------------------------------------- */

export interface SearchInputProps {
  /** Query-string key. Defaults to "q". */
  paramName?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Debounce delay in ms. Defaults to 300. */
  delay?: number;
  /** When true, also reset the page to 1 on each search. */
  resetPage?: boolean;
  className?: string;
  inputClassName?: string;
  /** Optional aria-label override. */
  ariaLabel?: string;
}

export function SearchInput({
  paramName = "q",
  placeholder = "Search…",
  delay = 300,
  resetPage = true,
  className,
  inputClassName,
  ariaLabel = "Search",
}: SearchInputProps) {
  const { searchParams, update } = useUpdateSearchParams();

  const urlValue = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState<string>(urlValue);
  const debounced = useDebounce(value, delay);

  // Keep the input in sync if the URL is reset elsewhere.
  useEffect(() => {
    setValue(urlValue);
  }, [urlValue]);

  // Push debounced value to the URL.
  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed === urlValue.trim()) return;
    update({
      [paramName]: trimmed === "" ? null : trimmed,
      ...(resetPage ? { page: null } : {}),
    });
  }, [debounced, paramName, resetPage, update, urlValue]);

  return (
    <div className={cn("relative w-full sm:max-w-sm", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
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
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          inputClassName,
        )}
      />
    </div>
  );
}
