import { Sparkles, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EngineBadge({ engine }: { engine: string }) {
  const isAI = engine.toLowerCase() === "deepseek";
  return (
    <Badge variant={isAI ? "accent" : "secondary"}>
      {isAI ? <Sparkles className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
      {isAI ? "AI Analysis (DeepSeek)" : "Offline Engine"}
    </Badge>
  );
}
