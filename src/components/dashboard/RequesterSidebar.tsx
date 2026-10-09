"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/primitives";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import {
  ChevronRightIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  PlusCircleIcon,
  UserIcon,
  XIcon,
} from "./icons";

/* ----------------------------------------------------------------------
   RequesterSidebar + RequesterTopbar
   ----------------------------------------------------------------------
   Same shape as the admin sidebar. The sidebar renders the four
   requester-area links; the topbar shows the page title (derived from
   `usePathname`) and a user dropdown.
   ---------------------------------------------------------------------- */

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/dashboard/requests/new", label: "New Request", icon: PlusCircleIcon },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCardIcon },
  { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
] as const;

export function RequesterSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <BrandHeader />
        <nav className="flex-1 overflow-y-auto p-3">
          <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
        </nav>
        <UserBlock name={user?.name} email={user?.email} role={user?.role} />
      </aside>

      {/* Mobile sheet */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-foreground/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col border-r border-border bg-card shadow-xl transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <BrandHeader compact />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
              aria-label="Close menu"
            >
              <XIcon size={16} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3">
            <NavList pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </nav>
          <UserBlock name={user?.name} email={user?.email} role={user?.role} />
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm md:hidden"
        aria-label="Open menu"
        data-mobile-menu-trigger
      >
        <MenuIcon size={18} />
      </button>
    </>
  );
}

export function RequesterTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { searchParams } = useUpdateSearchParams();
  const refreshed = searchParams.get("refreshed");

  const title = deriveTitle(pathname);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // noop
    } finally {
      router.replace("/login");
    }
  }

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {title}
        </h1>
        {refreshed ? (
          <span className="hidden rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success sm:inline-flex">
            Updated
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
            <span
              aria-hidden
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {initials(user?.name)}
            </span>
            <span className="hidden sm:inline">{user?.name ?? "Account"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <UserIcon size={14} /> Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10"
            >
              <LogOutIcon size={14} /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Building blocks
   ---------------------------------------------------------------------- */
function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon size={16} />
              <span className="flex-1">{item.label}</span>
              {active ? <ChevronRightIcon size={14} /> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-2 border-b border-border",
        compact ? "p-2" : "p-4",
      )}
    >
      <span
        aria-hidden
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
      >
        <span className="text-base">🩸</span>
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">My Requests</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Requester
        </span>
      </span>
    </Link>
  );
}

function UserBlock({
  name,
  email,
  role,
}: {
  name?: string;
  email?: string;
  role?: "ADMIN" | "DONOR" | "REQUESTER" | null;
}) {
  const router = useRouter();
  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // noop
    } finally {
      router.replace("/login");
    }
  }
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-3 rounded-md bg-muted/40 p-2">
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {name ?? "Requester"}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email ?? "—"}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {role ? ROLE_LABELS[role] : "REQUESTER"}
        </span>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LogOutIcon size={14} /> Logout
      </button>
    </div>
  );
}

function initials(name?: string | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function deriveTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Overview";
  if (pathname === "/dashboard/requests/new") return "New Request";
  if (pathname.startsWith("/dashboard/requests/")) return "Request details";
  if (pathname === "/dashboard/payments") return "Payments";
  if (pathname === "/dashboard/profile") return "Profile";
  return "Dashboard";
}
