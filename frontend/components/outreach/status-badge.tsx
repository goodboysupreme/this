import { Badge } from "@/components/ui/badge";

export function CampaignStatusBadge({ status, dryRun }: { status: string; dryRun?: boolean }) {
  const s = (status ?? "").toLowerCase();
  if (dryRun || s === "dryrun" || s === "dry_run")
    return <Badge variant="secondary">Dry run</Badge>;
  if (s === "sent" || s === "completed" || s === "success")
    return <Badge variant="success">{status}</Badge>;
  if (s === "failed" || s === "error") return <Badge variant="danger">{status}</Badge>;
  if (s === "sending" || s === "running" || s === "queued" || s === "pending")
    return <Badge variant="warning">{status}</Badge>;
  return <Badge variant="secondary">{status || "unknown"}</Badge>;
}
