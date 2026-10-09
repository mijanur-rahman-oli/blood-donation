"use client";

import { useEffect, useState } from "react";

/* ----------------------------------------------------------------------
   useDebounce
   ----------------------------------------------------------------------
   Returns a value that only updates after `delay` ms of inactivity.
   Used by the URL-synced search inputs to avoid pushing a new URL on
   every keystroke.
   ---------------------------------------------------------------------- */

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
