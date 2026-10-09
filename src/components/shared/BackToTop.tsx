"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   BackToTop
   ----------------------------------------------------------------------
   Floating, fixed-bottom-right button. Renders only after the page has
   scrolled past 400px. Smooth scroll to top on click. Accessible
   (aria-label, focus ring, keyboard activatable).
   ---------------------------------------------------------------------- */

export function BackToTop({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const y =
        typeof window !== "undefined" ? window.scrollY || window.pageYOffset : 0;
      setVisible(y > threshold);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  function handleClick() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "fixed bottom-6 right-6 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
  );
}
