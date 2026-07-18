import { Badge } from "@/components/ui/badge";

export function CampaignStatusBadge({ status, dryRun }: { status: string; dryRun?: boolean }) {
  const s = (status ?? "").toLowerCase();
  if (dryRun || s === "dryrun" || s === "dry_run")
    return <Badge variant="warning">Dry run</Badge>;
  if (s === "sent" || s === "completed" || s === "success")
    return <Badge variant="success">{status}</Badge>;
  if (s === "failed" || s === "error")
    return (
      <Badge className="border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-300">
        {status}
      </Badge>
    );
  if (s === "sending" || s === "running" || s === "queued")
    return <Badge variant="indigo">{status}</Badge>;
  return <Badge variant="secondary">{status || "unknown"}</Badge>;
}
