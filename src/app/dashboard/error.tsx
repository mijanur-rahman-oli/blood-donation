"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AlertTriangleIcon } from "@/components/dashboard/icons";
import { Button, Card, CardContent } from "@/components/admin/primitives";



export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Dashboard section error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangleIcon size={24} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "An unexpected error occurred."}
            </p>
            {error.digest ? (
              <p className="text-xs text-muted-foreground">
                Reference: <span className="font-mono">{error.digest}</span>
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button onClick={() => reset()}>Try Again</Button>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
