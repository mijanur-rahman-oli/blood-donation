import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   PageContainer
   ----------------------------------------------------------------------
   Single wrapper that controls the horizontal padding + max width of
   every role-dashboard page. Pairs with <PageHeader /> for the
   section header.
   ---------------------------------------------------------------------- */

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
