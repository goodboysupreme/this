import { ServerCrash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function OfflineState({ what = "data" }: { what?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
          <ServerCrash className="h-6 w-6 text-amber-400" />
        </span>
        <p className="font-medium text-zinc-800 dark:text-zinc-200">Backend is offline</p>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Couldn&apos;t reach the PlaceIQ API, so {what} can&apos;t be loaded right now. Start the
          backend at <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-white/10">http://localhost:8000</code> and refresh.
        </p>
      </CardContent>
    </Card>
  );
}
