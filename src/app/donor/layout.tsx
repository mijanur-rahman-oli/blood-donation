import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/RoleGuard";

import { DonorSidebar, DonorTopbar } from "@/components/donor/DonorSidebar";



export default function DonorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["DONOR"]}>
      <div className="flex min-h-screen w-full bg-background">
        <DonorSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DonorTopbar />
          <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
