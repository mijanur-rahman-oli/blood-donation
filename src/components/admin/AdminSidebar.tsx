"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { ROLE_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./primitives";

import {
  ChevronRightIcon,
  DropletIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MenuIcon,
  ScrollTextIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "./icons";

/* ----------------------------------------------------------------------
   AdminSidebar + AdminTopbar
   ----------------------------------------------------------------------
   Two client components that drive the (admin) layout chrome. The
   sidebar is rendered inside the layout, fixed on the left for desktop
   and as a slide-down sheet on mobile. The topbar is shown on every
   screen size and contains the mobile menu trigger, the page title
   (derived from the pathname), and a user dropdown.
   ---------------------------------------------------------------------- */

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: UsersIcon,
  },
  {
    href: "/admin/requests",
    label: "Blood Requests",
    icon: DropletIcon,
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: ScrollTextIcon,
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const navList = (
    <NavList
      pathname={pathname}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <BrandHeader />
        <nav className="flex-1 overflow-y-auto p-3">{navList}</nav>
        <UserBlock name={user?.name} email={user?.email} role={user?.role} />
      </aside>

      {/* Mobile sheet (only mounted on small screens) */}
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
          <nav className="flex-1 overflow-y-auto p-3">{navList}</nav>
          <UserBlock name={user?.name} email={user?.email} role={user?.role} />
        </aside>
      </div>

      {/* Mobile menu trigger (rendered outside the layout, positioned
          absolutely so it can sit in the topbar on small screens). */}
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

export function AdminTopbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { searchParams } = useUpdateSearchParams();

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

  // Surface a "Results updated" hint when ?refreshed=1 lands in the URL
  // (used by mutations across the admin pages to give post-redirect feedback).
  const refreshed = searchParams.get("refreshed");

  return (
    <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger — rendered by the sidebar mount above */}
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
            <span className="hidden sm:inline">{user?.name ?? "Admin"}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin")}>
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
      href="/admin"
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
        <span className="text-sm font-semibold text-foreground">Blood Admin</span>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Console
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
            {name ?? "Admin user"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {email ?? "—"}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {role ? ROLE_LABELS[role] : "ADMIN"}
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
  if (!name) return "A";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "A";
}

function deriveTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/requests")) return "Blood Requests";
  if (pathname.startsWith("/admin/audit-logs")) return "Audit Logs";
  return "Admin";
}
