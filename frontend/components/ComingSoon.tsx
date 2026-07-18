import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/FadeIn";

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
      <FadeIn>
        <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <Icon className="h-8 w-8 text-white" />
        </span>
      </FadeIn>
      <FadeIn delay={0.1}>
        <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          {title}
        </h1>
      </FadeIn>
      <FadeIn delay={0.2}>
        <div className="mt-4">
          <Badge variant="indigo">Coming in {phase}</Badge>
        </div>
      </FadeIn>
      <FadeIn delay={0.3}>
        <p className="mt-6 max-w-xl text-zinc-500 dark:text-zinc-400">{description}</p>
      </FadeIn>
      <FadeIn delay={0.4} className="mt-10 w-full">
        <Card>
          <CardContent className="py-8 text-sm text-zinc-500 dark:text-zinc-400">
            The intelligence hub (Placements, PS-1, PS-2, SI) is live now — explore it from the
            navigation bar while we finish building this.
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
