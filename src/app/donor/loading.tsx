import {
  Card,
  CardContent,
  CardHeader,
  Skeleton,
} from "@/components/admin/primitives";

/* ----------------------------------------------------------------------
   /donor loading skeleton
   ----------------------------------------------------------------------
   Mirrors the dashboard layout: availability toggle placeholder + 3
   assignment card skeletons.
   ---------------------------------------------------------------------- */

export default function DonorLoading() {
  return (
    <div className="space-y-6" aria-busy aria-live="polite">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <Card>
        <CardContent className="flex items-center justify-between p-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-7 w-12 rounded-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <span className="sr-only">Loading donor dashboard…</span>
    </div>
  );
}
