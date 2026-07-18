import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ExplorerSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* header */}
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-3 h-5 w-full max-w-2xl" />

      {/* filter bar */}
      <Card className="mt-8">
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 min-w-[200px] flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-10 w-52" />
        </CardContent>
      </Card>

      {/* charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardContent className="py-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-52 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* table */}
      <Card className="mt-6">
        <CardContent className="py-6">
          <Skeleton className="h-6 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mt-3 h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
