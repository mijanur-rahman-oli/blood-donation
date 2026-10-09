import type { Metadata } from "next";

import { UnauthorizedActions } from "@/components/shared/UnauthorizedActions";
import { APP_NAME } from "@/lib/constants";

/* ----------------------------------------------------------------------
   /unauthorized
   ----------------------------------------------------------------------
   Server component. Renders when the middleware (or RoleGuard) decides
   the signed-in user does not have permission to view the requested
   page. Provides two recovery actions: "Go to Home" (router push, no
   full reload) and "Log out" (calls /api/auth/logout then hard-
   navigates to /login so the store and query cache are reset).
   ---------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Access Denied",
  description:
    "You don't have permission to view this page. Sign in with an account that has the right role.",
  robots: { index: false, follow: false },
};

function ShieldXIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="9.5" y1="9.5" x2="14.5" y2="14.5" />
      <line x1="14.5" y1="9.5" x2="9.5" y2="14.5" />
    </svg>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4 py-12 sm:px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldXIcon className="h-10 w-10" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
          Access Denied
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          You don&apos;t have permission to view this page. If you
          believe this is a mistake, please contact support at{" "}
          <a
            href="mailto:support@blood-donation.example.com"
            className="font-medium text-primary hover:underline"
          >
            support@blood-donation.example.com
          </a>
          .
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-3">
          <UnauthorizedActions />
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {APP_NAME} &middot; Error 403
        </p>
      </div>
    </div>
  );
}
