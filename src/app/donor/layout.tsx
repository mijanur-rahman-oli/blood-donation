import type { ReactNode } from "react";

import { RoleGuard } from "@/components/shared/RoleGuard";

import { DonorSidebar, DonorTopbar } from "@/components/donor/DonorSidebar";

/* ----------------------------------------------------------------------
   (donor) layout
   ----------------------------------------------------------------------
   Server component. Wraps every donor page in
   <RoleGuard allow={["DONOR"]>. No public Navbar or Footer is mounted
   here — the root layout's <LayoutChrome> already suppresses both for
   /donor/*.
   ---------------------------------------------------------------------- */

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
