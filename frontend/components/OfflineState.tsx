import { ServerCrash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function OfflineState({ what = "data" }: { what?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <ServerCrash className="h-6 w-6 text-muted" />
        <p className="font-medium text-ink">Backend is offline</p>
        <p className="max-w-md text-sm text-muted">
          Couldn&apos;t reach the PlaceIQ API, so {what} can&apos;t be loaded right now. Start the
          backend at <code className="rounded bg-line/60 px-1.5 py-0.5 text-xs">http://localhost:8000</code> and refresh.
        </p>
      </CardContent>
    </Card>
  );
}
