import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/RoleGuard";

import {
  RequesterSidebar,
  RequesterTopbar,
} from "@/components/dashboard/RequesterSidebar";

/* ----------------------------------------------------------------------
   (dashboard) layout
   ----------------------------------------------------------------------
   Server component. Wraps every requester page in
   <RoleGuard allow={["REQUESTER"]>. No public Navbar or Footer is
   mounted here — the root layout's <LayoutChrome> already suppresses
   both for /dashboard/*.
   ---------------------------------------------------------------------- */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["REQUESTER"]}>
      <div className="flex min-h-screen w-full bg-background">
        <RequesterSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <RequesterTopbar />
          <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
