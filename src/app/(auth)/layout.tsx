import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_URL } from "@/lib/constants";

/* ----------------------------------------------------------------------
   (auth) route group layout
   ----------------------------------------------------------------------
   Shared chrome for /login and /register. Intentionally minimal:
     - No Navbar / Footer (so the user is not one click away from
       leaving the auth flow)
     - No Suspense boundary around the pages — Next.js handles the
       client `useSearchParams` suspend fallback at the route level
   ---------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "Account",
  description:
    "Login to your existing account or create a new one as a donor or requester.",
  alternates: { canonical: `${APP_URL}/login` },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen w-full bg-background">{children}</div>;
}
