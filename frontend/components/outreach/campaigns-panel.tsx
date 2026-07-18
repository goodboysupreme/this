"use client";

import { useState } from "react";
import { FlaskConical, Loader2, Mail, Send, ShieldAlert } from "lucide-react";
import type {
  Campaign,
  CampaignCreateResult,
  OutreachContact,
  OutreachTemplate,
  SMTPConfig,
} from "@/lib/types";
import { createCampaign } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { OfflineState } from "@/components/OfflineState";
import { CampaignStatusBadge } from "./status-badge";

const EMPTY_SMTP: SMTPConfig = { host: "", port: 587, username: "", password: "", use_tls: true };

export function CampaignsPanel({
  contacts,
  templates,
  campaigns,
  loaded,
  onChanged,
}: {
  contacts: OutreachContact[] | null;
  templates: OutreachTemplate[] | null;
  campaigns: Campaign[] | null;
  loaded: boolean;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dryRun, setDryRun] = useState(true);
  const [smtp, setSmtp] = useState<SMTPConfig>(EMPTY_SMTP);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CampaignCreateResult | null>(null);

  const contactList = contacts ?? [];
  const templateList = templates ?? [];
  const canSubmit =
    name.trim() !== "" && templateId !== "" && selected.size > 0 && !sending;

  function toggleContact(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit() {
    if (!canSubmit) return;
    setSending(true);
    setError(null);
    setResult(null);
    const res = await createCampaign({
      name: name.trim(),
      template_id: Number(templateId),
      contact_ids: [...selected],
      dry_run: dryRun,
      ...(dryRun ? {} : { smtp }),
    });
    setSending(false);
    if (!res) {
      setError("Couldn't create the campaign. The backend may be offline.");
      return;
    }
    setResult(res);
    setName("");
    setSelected(new Set());
    await onChanged();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* New campaign */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New campaign</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Campaign name
              </label>
              <Input
                placeholder="e.g. Summer 2026 referral round"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={sending}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
                Template
              </label>
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={sending || templateList.length === 0}
              >
                <option value="">
                  {templateList.length === 0 ? "No templates, create one first" : "Select a template"}
                </option>
                {templateList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                Recipients
              </label>
              <span className="text-xs text-muted">
                <span className="stat-num">{selected.size}</span> selected
              </span>
            </div>
            {contactList.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-muted">
                No contacts yet, import a CSV in the Contacts tab first.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-line">
                {contactList.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 border-b border-line px-4 py-2.5 transition-colors last:border-0 hover:bg-surface"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleContact(c.id)}
                      disabled={sending}
                      className="h-4 w-4 accent-accent"
                    />
                    <span className="text-sm font-medium text-ink">{c.name}</span>
                    <span className="text-xs text-muted">
                      {c.role} · {c.company} · {c.email}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Dry-run toggle */}
          <div
            className={cn(
              "flex items-center justify-between gap-4 rounded-lg border px-4 py-3",
              dryRun ? "border-warn/40 bg-warn-soft" : "border-line"
            )}
          >
            <div className="flex items-center gap-3">
              <FlaskConical
                className={cn("h-5 w-5", dryRun ? "text-warn" : "text-muted")}
              />
              <div>
                <p className="text-sm font-semibold text-ink">Dry run</p>
                <p className="text-xs text-muted">
                  {dryRun
                    ? "No emails will be sent. The campaign is simulated and logged only."
                    : "Live mode: emails will actually be sent via your SMTP below."}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dryRun}
              onClick={() => setDryRun((v) => !v)}
              disabled={sending}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                dryRun ? "bg-warn" : "bg-line"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full border border-line bg-white transition-all",
                  dryRun ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>
          {dryRun && (
            <p className="rounded-lg border border-warn/40 bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
              Dry run: no emails will be sent.
            </p>
          )}

          {/* SMTP */}
          <fieldset disabled={dryRun || sending} className={cn(dryRun && "opacity-50")}>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
              SMTP settings (required for live sending)
            </legend>
            <div className="grid gap-3 rounded-lg border border-line p-4 sm:grid-cols-2">
              <Input
                placeholder="SMTP host, e.g. smtp.gmail.com"
                value={smtp.host}
                onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))}
              />
              <Input
                placeholder="Port, e.g. 587"
                type="number"
                value={smtp.port}
                onChange={(e) => setSmtp((s) => ({ ...s, port: Number(e.target.value) || 0 }))}
              />
              <Input
                placeholder="Username / email"
                value={smtp.username}
                onChange={(e) => setSmtp((s) => ({ ...s, username: e.target.value }))}
              />
              <Input
                placeholder="Password / app password"
                type="password"
                value={smtp.password}
                onChange={(e) => setSmtp((s) => ({ ...s, password: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={smtp.use_tls}
                  onChange={(e) => setSmtp((s) => ({ ...s, use_tls: e.target.checked }))}
                  className="h-4 w-4 accent-accent"
                />
                Use TLS
              </label>
              <p className="flex items-start gap-1.5 text-xs text-muted">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Credentials are used only for this send and are not stored by PlaceIQ.
              </p>
            </div>
          </fieldset>

          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {result && (
            <p className="rounded-lg border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
              Campaign <span className="stat-num">#{result.campaign_id}</span> created (
              {result.status}): <span className="stat-num">{result.sent}</span> sent,{" "}
              <span className="stat-num">{result.failed}</span> failed,{" "}
              <span className="stat-num">{result.dryrun}</span> dry-run.
            </p>
          )}
          <div>
            <Button variant="default" onClick={submit} disabled={!canSubmit}>
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> {dryRun ? "Simulate campaign" : "Send campaign"}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns list */}
      {campaigns === null ? (
        loaded ? (
          <OfflineState what="your campaigns" />
        ) : null
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
              <Mail className="h-6 w-6" />
            </span>
            <p className="font-medium text-ink">No campaigns yet</p>
            <p className="max-w-md text-sm text-muted">
              Create your first campaign above. Keep dry run on to rehearse safely.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {campaigns.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{c.name}</p>
                <p className="text-xs text-muted">
                  <span className="stat-num">#{c.id}</span>
                  {c.created_at && ` · ${new Date(c.created_at).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>
                  <span className="stat-num font-semibold text-success">{c.sent ?? 0}</span> sent
                </span>
                <span>
                  <span className="stat-num font-semibold text-danger">{c.failed ?? 0}</span> failed
                </span>
                <span>
                  <span className="stat-num font-semibold text-warn">{c.dryrun ?? 0}</span> dry-run
                </span>
              </div>
              <CampaignStatusBadge status={c.status} dryRun={c.dry_run} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
