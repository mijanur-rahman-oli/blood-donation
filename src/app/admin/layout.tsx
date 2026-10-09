import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/RoleGuard";

import { AdminSidebar, AdminTopbar } from "@/components/admin/AdminSidebar";

/* ----------------------------------------------------------------------
   (admin) layout
   ----------------------------------------------------------------------
   Server component. Wraps every admin page in
   <RoleGuard allow={["ADMIN"]> so unauthenticated or wrong-role users
   never see admin content, and renders the shared sidebar + topbar.
   No public Navbar or Footer is mounted here — the root layout's
   <LayoutChrome> already suppresses both for /admin/*.
   ---------------------------------------------------------------------- */

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
