import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_URL } from "@/lib/constants";

/* ----------------------------------------------------------------------
   /faq metadata
   ----------------------------------------------------------------------
   Exported from a server `layout.tsx` because the page is a client
   component. App Router does not allow `metadata` exports from client
   modules.
   ---------------------------------------------------------------------- */

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Everything you need to know about donating, requesting, paying, and staying private on the platform.",
  alternates: { canonical: `${APP_URL}/faq` },
};

export default function FaqLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
