"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   UnauthorizedActions
   ----------------------------------------------------------------------
   The two action buttons on the /unauthorized page need client-side
   state (a "logging out…" flag) so we keep them isolated here. The
   server component page just renders <UnauthorizedActions /> as the
   button row.
   ---------------------------------------------------------------------- */

type Variant = "primary" | "outline";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-10 px-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline:
    "border border-input bg-background hover:bg-muted hover:text-foreground",
};

function buttonClass(variant: Variant, extra?: string) {
  return cn(baseClasses, variantClasses[variant], extra);
}

export interface UnauthorizedActionsProps {
  loginPath?: string;
  homePath?: string;
}

export function UnauthorizedActions({
  loginPath = "/login",
  homePath = "/",
}: UnauthorizedActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { accept: "application/json" },
      });
      // The route handler clears all auth cookies regardless of the
      // backend's response, so we don't gate navigation on success.
      if (!res.ok && res.status !== 401) {
        const body = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        if (body?.message) {
          // Surface the message but still redirect — the user is
          // already on /unauthorized and we don't want to trap them.
          setError(body.message);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error during logout",
      );
    } finally {
      // Use window.location so the Zustand store and any in-memory
      // query cache are guaranteed to reset.
      window.location.href = loginPath;
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => router.push(homePath)}
          className={buttonClass("primary")}
        >
          Go to Home
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={busy}
          className={buttonClass("outline")}
        >
          {busy ? "Logging out…" : "Log out"}
        </button>
      </div>
      {error ? (
        <p
          role="alert"
          className="text-xs font-medium text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
