import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/RoleGuard";

import {
  RequesterSidebar,
  RequesterTopbar,
} from "@/components/dashboard/RequesterSidebar";



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
