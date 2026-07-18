import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "indigo" | "violet" | "success" | "warning";

const variants: Record<Variant, string> = {
  default: "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900",
  secondary: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300",
  outline: "border border-zinc-300 text-zinc-600 dark:border-white/15 dark:text-zinc-400",
  indigo: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 dark:text-indigo-300",
  violet: "bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-300",
  success: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-300",
  warning: "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:text-amber-300",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
