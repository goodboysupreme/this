import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  icon: Icon,
  title,
  phase,
  description,
}: {
  icon: LucideIcon;
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-line bg-surface text-muted">
        <Icon className="h-6 w-6" />
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h1>
      <div className="mt-4">
        <Badge variant="accent">Coming in {phase}</Badge>
      </div>
      <p className="mt-6 max-w-xl text-muted">{description}</p>
      <Card className="mt-10 w-full">
        <CardContent className="py-8 text-sm text-muted">
          The intelligence hub (Placements, PS-1, PS-2, SI) is live now. Explore it from the
          navigation bar while we finish building this.
        </CardContent>
      </Card>
    </div>
  );
}
