"use client";

import { useParams } from "next/navigation";

import RequestDetail from "@/components/dashboard/RequestDetail";
import { Skeleton } from "@/components/admin/primitives";

/* ----------------------------------------------------------------------
   /dashboard/requests/[id]
   ----------------------------------------------------------------------
   Client component. The whole page is a Client Component so the
   Server Component prerender pass never touches it. `useParams()`
   returns the dynamic `id` and we hand it to <RequestDetail />.

   No `metadata` or `generateMetadata` is exported on this route, so
   the framework does not try to compute per-route metadata. The root
   layout's static `metadata` applies to every request.
   ---------------------------------------------------------------------- */

export default function RequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  if (!id) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  return <RequestDetail id={id} />;
}
