"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api, extractApiError } from "@/lib/axios";
import { APP_NAME, ROLE_HOME, ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useAuthStore } from "@/store/authStore";

/* ----------------------------------------------------------------------
   Navbar
   ----------------------------------------------------------------------
   Role-aware top navigation. Renders the same links to all visitors
   (Home / About / Services / FAQ) and conditionally shows the
   role-specific dashboard link plus a user dropdown when authenticated.

   Mobile: collapses into a slide-down panel toggled by the hamburger.
   No external UI dependencies — built with native elements + Tailwind so
   it works the moment dependencies are installed.
   ---------------------------------------------------------------------- */

interface NavLink {
  href: string;
  label: string;
}

const PUBLIC_LINKS: readonly NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/faq", label: "FAQ" },
];

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { isAdmin, isDonor, isRequester } = useRole();
  const setUser = useAuthStore((s) => s.setUser);
  const clearStore = useAuthStore((s) => s.clear);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close menus on route change.
  useEffect(() => {
    const close = () => {
      setMobileOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, []);

  // Close dropdown when clicking outside.
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-user-menu]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const dashboardHref = user ? ROLE_HOME[user.role] : "/login";
  const dashboardLabel = user
    ? isAdmin
      ? "Admin Console"
      : isDonor
      ? "Donor Dashboard"
      : isRequester
      ? "My Dashboard"
      : "Dashboard"
    : "Log in";

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout", {});
    } catch (error) {
      // Surface the error but always clear the local session so the user
      // is not trapped behind a stale UI state.
      // eslint-disable-next-line no-console
      console.warn("Logout request failed:", extractApiError(error));
    } finally {
      clearStore();
      setUser(null);
      setLoggingOut(false);
      setMenuOpen(false);
      router.replace("/");
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-app flex h-16 items-center justify-between gap-4">
        {/* Brand */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold text-foreground"
        >
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
            </svg>
          </span>
          <span className="hidden sm:inline">{APP_NAME}</span>
          <span className="sr-only sm:hidden">Blood donation home</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-1">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Hydration guard: render a neutral skeleton until /users/me settles. */}
          {!isHydrated ? (
            <div
              aria-hidden
              className="h-9 w-24 animate-pulse rounded-md bg-muted"
            />
          ) : isAuthenticated && user ? (
            <div className="relative" data-user-menu>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                >
                  {initialsOf(user.name)}
                </span>
                <span className="hidden sm:inline">{user.name}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    <p className="truncate font-medium text-foreground">{user.name}</p>
                    <p className="truncate">{user.email}</p>
                    <p className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      {ROLE_LABELS[user.role]}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <Link
                    role="menuitem"
                    href={dashboardHref}
                    className="block rounded-sm px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => setMenuOpen(false)}
                  >
                    {dashboardLabel}
                  </Link>
                  {(isRequester || isAdmin) && (
                    <Link
                      role="menuitem"
                      href="/dashboard/profile"
                      className="block rounded-sm px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  {isDonor && (
                    <Link
                      role="menuitem"
                      href="/donor/profile"
                      className="block rounded-sm px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="block w-full rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Get started
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden border-t border-border bg-background overflow-hidden transition-[max-height,opacity] duration-200",
          mobileOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container-app flex flex-col gap-1 py-4">
          {PUBLIC_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}

          <div className="my-2 h-px bg-border" />

          {isHydrated && isAuthenticated && user ? (
            <>
              <Link
                href={dashboardHref}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                {dashboardLabel}
              </Link>
              {(isRequester || isAdmin) && (
                <Link
                  href="/dashboard/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Profile
                </Link>
              )}
              {isDonor && (
                <Link
                  href="/donor/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
                >
                  Profile
                </Link>
              )}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function initialsOf(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
