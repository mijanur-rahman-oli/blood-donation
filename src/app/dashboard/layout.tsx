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
   <RoleGuard allow={["REQUESTER"]}> and renders the shared sidebar +
   topbar. Admins can also reach these pages if their role matches
   (RoleGuard permits the configured allow list).
   ---------------------------------------------------------------------- */

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["REQUESTER"]}>
      <div className="flex min-h-screen w-full bg-background">
        <RequesterSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <RequesterTopbar />
          <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
