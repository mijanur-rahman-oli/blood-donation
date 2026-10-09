import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/RoleGuard";

import { DonorSidebar, DonorTopbar } from "@/components/donor/DonorSidebar";

/* ----------------------------------------------------------------------
   (donor) layout
   ----------------------------------------------------------------------
   Server component. Wraps every donor page in
   <RoleGuard allow={["DONOR"]}> and renders the shared sidebar +
   topbar.
   ---------------------------------------------------------------------- */

export default function DonorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allow={["DONOR"]}>
      <div className="flex min-h-screen w-full bg-background">
        <DonorSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <DonorTopbar />
          <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
