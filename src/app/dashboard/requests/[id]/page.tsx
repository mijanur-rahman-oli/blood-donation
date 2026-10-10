"use client";

import { useParams } from "next/navigation";

import RequestDetail from "@/components/dashboard/RequestDetail";
import { Skeleton } from "@/components/admin/primitives";



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
