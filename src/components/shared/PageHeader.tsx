import type { ReactNode } from "react";

/* ----------------------------------------------------------------------
   PageHeader
   ----------------------------------------------------------------------
   Consistent title + description + optional action slot used at the
   top of every role-dashboard page. Server-Component safe (no
   hooks). Renders a bottom border so the section boundary reads even
   when the page background is the same colour as the header.
   ---------------------------------------------------------------------- */

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="flex flex-wrap items-center gap-2">{action}</div>
      ) : null}
    </div>
  );
}
