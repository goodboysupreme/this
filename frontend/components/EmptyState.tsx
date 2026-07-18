import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  children,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/20 bg-indigo-500/10">
        <Icon className="h-6 w-6 text-indigo-400" />
      </span>
      <p className="font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {children}
    </div>
  );
}
