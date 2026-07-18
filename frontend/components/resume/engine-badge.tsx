import { Sparkles, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function EngineBadge({ engine }: { engine: string }) {
  const isAI = engine.toLowerCase() === "deepseek";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        isAI
          ? "border-indigo-500/30 bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300"
      )}
    >
      {isAI ? <Sparkles className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {isAI ? "AI Analysis (DeepSeek)" : "Offline Engine"}
    </span>
  );
}
