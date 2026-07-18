"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  ListChecks,
  Loader2,
  XCircle,
} from "lucide-react";
import type { Campaign, CampaignDetail, OutreachContact } from "@/lib/types";
import { getCampaign } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OfflineState } from "@/components/OfflineState";
import { CampaignStatusBadge } from "./status-badge";

function LogStatusIcon({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  if (s === "sent") return <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />;
  if (s === "failed") return <XCircle className="h-4 w-4 shrink-0 text-danger" />;
  return <FlaskConical className="h-4 w-4 shrink-0 text-warn" />;
}

export function SendLogPanel({
  campaigns,
  contacts,
  loaded,
}: {
  campaigns: Campaign[] | null;
  contacts: OutreachContact[] | null;
  loaded: boolean;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const contactById = new Map((contacts ?? []).map((c) => [c.id, c]));

  async function toggle(id: number) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    setDetailError(null);
    setLoadingDetail(true);
    const res = await getCampaign(id);
    setLoadingDetail(false);
    if (!res) {
      setDetailError("Couldn't load the send log. The backend may be offline.");
      return;
    }
    setDetail(res);
  }

  if (campaigns === null) {
    return loaded ? <OfflineState what="the send log" /> : null;
  }

  if (campaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
            <ListChecks className="h-6 w-6" />
          </span>
          <p className="font-medium text-ink">Nothing logged yet</p>
          <p className="max-w-md text-sm text-muted">
            Run a campaign (dry-run counts too) and per-contact send logs will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
      {campaigns.map((c) => {
        const open = openId === c.id;
        return (
          <div key={c.id}>
            <button
              onClick={() => toggle(c.id)}
              className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-surface sm:px-6"
              aria-expanded={open}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">
                  <span className="stat-num">#{c.id}</span>
                  {c.created_at && ` · ${new Date(c.created_at).toLocaleString()}`}
                </p>
              </div>
              <CampaignStatusBadge status={c.status} dryRun={c.dry_run} />
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
            {open && (
              <div className="border-t border-line px-4 py-4 sm:px-6">
                {loadingDetail ? (
                  <p className="flex items-center gap-2 py-4 text-sm text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading log…
                  </p>
                ) : detailError ? (
                  <p className="py-2 text-sm text-danger">{detailError}</p>
                ) : detail && detail.logs && detail.logs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <span className="sr-only">Status</span>
                        </TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead className="text-right">Sent at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.logs.map((log) => {
                        const contact = contactById.get(log.contact_id);
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="px-4 py-2.5">
                              <LogStatusIcon status={log.status} />
                            </TableCell>
                            <TableCell className="px-4 py-2.5">
                              <span className="text-sm font-medium text-ink">
                                {contact ? (
                                  contact.name
                                ) : (
                                  <>Contact <span className="stat-num">#{log.contact_id}</span></>
                                )}
                              </span>
                              {contact && (
                                <span className="ml-2 text-xs text-muted">{contact.email}</span>
                              )}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-xs text-muted">
                              {log.detail}
                            </TableCell>
                            <TableCell className="stat-num px-4 py-2.5 text-right text-xs text-muted">
                              {log.sent_at ? new Date(log.sent_at).toLocaleString() : "Not sent"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="py-2 text-sm text-muted">
                    No log entries for this campaign yet.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
