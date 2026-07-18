import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        </div>
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-9 w-20" />
              <Skeleton className="mt-3 h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-10">
        <CardContent className="py-6">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mt-3 h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
