"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

/* ----------------------------------------------------------------------
   LayoutChrome
   ----------------------------------------------------------------------
   Single source of truth for "should the public Navbar + Footer render
   on this page?". The root layout wraps every page in this component.
   For any route under a protected prefix we render only `{children}` —
   the route group layouts for /admin, /dashboard, /donor already ship
   their own sidebars + topbars, and the /login, /register, /payment
   pages ship their own minimal chrome.
   ---------------------------------------------------------------------- */

const HIDDEN_PREFIXES: readonly string[] = [
  "/admin",
  "/dashboard",
  "/donor",
  "/login",
  "/register",
  "/payment",
];

function shouldHideChrome(pathname: string | null): boolean {
  if (!pathname) return false;
  return HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

interface LayoutChromeProps {
  children: ReactNode;
}

export function LayoutChrome({ children }: LayoutChromeProps) {
  const pathname = usePathname();
  const hide = shouldHideChrome(pathname);

  if (hide) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex-1">{children}</main>
      <Footer />
    </>
  );
}
