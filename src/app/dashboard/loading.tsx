import {
  Card,
  CardContent,
  CardHeader,
  Skeleton,
} from "@/components/admin/primitives";

/* ----------------------------------------------------------------------
   /dashboard loading skeleton
   ----------------------------------------------------------------------
   Mirrors the real overview layout: heading + 4 mini stat cards + a
   list of 3 request cards.
   ---------------------------------------------------------------------- */

export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 py-6">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border border-border p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>

      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
