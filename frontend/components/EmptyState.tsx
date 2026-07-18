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
      <Icon className="h-6 w-6 text-muted" />
      <p className="font-medium text-ink">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-muted">{description}</p>
      )}
      {children}
    </div>
  );
}
