import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/primitives";
import { Skeleton } from "@/components/admin/primitives";

/* ----------------------------------------------------------------------
   /admin loading skeleton
   ----------------------------------------------------------------------
   Mirrors the actual dashboard layout so the page does not shift when
   data lands. Renders: 4 StatCard placeholders, 2 large chart
   placeholders, 1 table placeholder.
   ---------------------------------------------------------------------- */

export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 py-6">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-4 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-4 w-40" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-4 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>

      <span className="sr-only">Loading admin dashboard…</span>
    </div>
  );
}
