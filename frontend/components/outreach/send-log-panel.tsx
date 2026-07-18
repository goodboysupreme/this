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
import { OfflineState } from "@/components/OfflineState";
import { CampaignStatusBadge } from "./status-badge";

function LogStatusIcon({ status }: { status: string }) {
  const s = (status ?? "").toLowerCase();
  if (s === "sent") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />;
  if (s === "failed") return <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />;
  return <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />;
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
      setDetailError("Couldn't load the send log — the backend may be offline.");
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
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
            <ListChecks className="h-6 w-6 text-indigo-400" />
          </span>
          <p className="font-medium text-zinc-800 dark:text-zinc-200">Nothing logged yet</p>
          <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Run a campaign (dry-run counts too) and per-contact send logs will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {campaigns.map((c) => {
        const open = openId === c.id;
        return (
          <Card key={c.id}>
            <button
              onClick={() => toggle(c.id)}
              className="flex w-full items-center gap-4 px-6 py-4 text-left"
              aria-expanded={open}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-zinc-900 dark:text-white">{c.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  #{c.id}
                  {c.created_at && ` · ${new Date(c.created_at).toLocaleString()}`}
                </p>
              </div>
              <CampaignStatusBadge status={c.status} dryRun={c.dry_run} />
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-zinc-400 transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
            {open && (
              <div className="border-t border-zinc-100 px-6 py-4 dark:border-white/5">
                {loadingDetail ? (
                  <p className="flex items-center gap-2 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading log…
                  </p>
                ) : detailError ? (
                  <p className="py-2 text-sm text-red-500 dark:text-red-400">{detailError}</p>
                ) : detail && detail.logs && detail.logs.length > 0 ? (
                  <ul className="flex flex-col gap-2.5">
                    {detail.logs.map((log) => {
                      const contact = contactById.get(log.contact_id);
                      return (
                        <li
                          key={log.id}
                          className="flex items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-white/10"
                        >
                          <LogStatusIcon status={log.status} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              {contact ? contact.name : `Contact #${log.contact_id}`}
                              {contact && (
                                <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                                  {contact.email}
                                </span>
                              )}
                            </p>
                            {log.detail && (
                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                {log.detail}
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : "—"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="py-2 text-sm text-zinc-500 dark:text-zinc-400">
                    No log entries for this campaign yet.
                  </p>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
