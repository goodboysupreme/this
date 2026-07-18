"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { BarChart3, Check, Database, KeyRound, ShieldAlert, Upload, X } from "lucide-react";
import {
  adminGetAnalytics,
  adminGetPending,
  adminModerateExperience,
  adminUploadDataset,
} from "@/lib/api";
import type { AdminAnalytics, DatasetKind, ExperienceRow } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const KEY_STORAGE = "placeiq_admin_key";
const DATASET_KINDS: DatasetKind[] = ["placement", "ps1", "ps2", "si", "companies"];

function getStoredKey(): string {
  try {
    return window.sessionStorage.getItem(KEY_STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function AdminClient() {
  const [key, setKey] = useState<string | null>(null); // null = not yet read from storage
  const [unlocked, setUnlocked] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const stored = getStoredKey();
    setKey(stored);
    // A stored key unlocks immediately; a 403 from any panel re-locks the gate.
    if (stored) setUnlocked(true);
  }, []);

  const handleForbidden = useCallback(() => {
    try {
      window.sessionStorage.removeItem(KEY_STORAGE);
    } catch {
      /* ignore */
    }
    setUnlocked(false);
    setInvalid(true);
    setKey("");
  }, []);

  if (key === null) return null;

  if (!unlocked) {
    return (
      <KeyGate
        initialKey={key}
        invalid={invalid}
        onSubmit={(k) => {
          try {
            window.sessionStorage.setItem(KEY_STORAGE, k);
          } catch {
            /* ignore */
          }
          setKey(k);
          setInvalid(false);
          setUnlocked(true);
        }}
      />
    );
  }

  return <AdminPanels adminKey={key} onForbidden={handleForbidden} />;
}

function KeyGate({
  initialKey,
  invalid,
  onSubmit,
}: {
  initialKey: string;
  invalid: boolean;
  onSubmit: (key: string) => void;
}) {
  const [value, setValue] = useState(initialKey);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (value.trim()) onSubmit(value.trim());
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 sm:px-6">
      <span className="mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
        <KeyRound className="h-6 w-6" />
      </span>
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Admin access</h1>
      <p className="mt-2 text-center text-sm text-muted">
        Enter the admin key to moderate experiences, upload datasets and view analytics.
      </p>
      <form
        onSubmit={submit}
        className="mt-8 w-full rounded-lg border border-line bg-surface p-6"
      >
        {invalid && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <ShieldAlert className="h-4 w-4 shrink-0" /> Invalid admin key.
          </div>
        )}
        <Input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Admin key"
          autoFocus
        />
        <Button type="submit" variant="default" className="mt-4 w-full">
          Unlock
        </Button>
      </form>
    </div>
  );
}

function AdminPanels({ adminKey, onForbidden }: { adminKey: string; onForbidden: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Admin console</h1>
      <p className="mt-2 text-muted">
        Moderation, dataset imports and site analytics.
      </p>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <PendingPanel adminKey={adminKey} onForbidden={onForbidden} />
        <div className="flex flex-col gap-6">
          <UploadPanel adminKey={adminKey} onForbidden={onForbidden} />
          <AnalyticsPanel adminKey={adminKey} onForbidden={onForbidden} />
        </div>
      </div>
    </div>
  );
}

/** Returns true if the call hit a 403 (and notified the parent to re-lock). */
function useAdminFetch(onForbidden: () => void) {
  return useCallback(
    (status: number): boolean => {
      if (status === 403) {
        onForbidden();
        return true;
      }
      return false;
    },
    [onForbidden]
  );
}

function PendingPanel({ adminKey, onForbidden }: { adminKey: string; onForbidden: () => void }) {
  const check = useAdminFetch(onForbidden);
  const [pending, setPending] = useState<ExperienceRow[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [acting, setActing] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await adminGetPending(adminKey);
    if (check(res.status)) return;
    setOffline(res.status === 0);
    setPending(res.data ?? []);
  }, [adminKey, check]);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(id: number, action: "approve" | "reject") {
    setActing(id);
    const res = await adminModerateExperience(adminKey, id, action);
    setActing(null);
    if (check(res.status)) return;
    if (res.data?.ok) {
      setPending((p) => (p ? p.filter((e) => e.id !== id) : p));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Pending experiences
          {pending && pending.length > 0 && (
            <Badge variant="warning" className="stat-num">
              {pending.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offline ? (
          <p className="text-sm text-muted">
            Backend unreachable. Start it and refresh.
          </p>
        ) : pending === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-line/50" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-muted">Nothing awaiting moderation.</p>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
            {pending.map((e) => (
              <div key={e.id} className="p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{TYPE_LABELS[e.type] ?? e.type}</Badge>
                  <Badge variant="outline" className="stat-num">
                    {e.year}
                  </Badge>
                  <span className="text-sm font-medium text-ink">{e.company_name}</span>
                  {e.author_hint && (
                    <span className="text-xs text-muted">{e.author_hint}</span>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {e.content}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={acting === e.id}
                    onClick={() => moderate(e.id, "approve")}
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={acting === e.id}
                    onClick={() => moderate(e.id, "reject")}
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UploadPanel({ adminKey, onForbidden }: { adminKey: string; onForbidden: () => void }) {
  const check = useAdminFetch(onForbidden);
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<DatasetKind>("placement");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setResult(null);
    setError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    const res = await adminUploadDataset(adminKey, file, kind);
    setBusy(false);
    if (check(res.status)) return;
    if (res.data) {
      setResult(res.data);
    } else {
      setError(res.status === 0 ? "Backend unreachable." : "Upload failed. Check the file format.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted" /> Dataset upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {result && (
            <div className="rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success">
              Imported <span className="stat-num">{result.imported}</span> row
              {result.imported === 1 ? "" : "s"}, skipped{" "}
              <span className="stat-num">{result.skipped}</span>.
            </div>
          )}
          {error && (
            <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Kind</span>
              <Select value={kind} onChange={(e) => setKind(e.target.value as DatasetKind)}>
                {DATASET_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k === "companies" ? "Companies" : TYPE_LABELS[k]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={onFile}
                className="text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
              />
            </label>
          </div>
          <Button type="submit" variant="default" disabled={busy} className="self-start">
            <Upload className="h-4 w-4" />
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AnalyticsPanel({ adminKey, onForbidden }: { adminKey: string; onForbidden: () => void }) {
  const check = useAdminFetch(onForbidden);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    adminGetAnalytics(adminKey).then((res) => {
      if (check(res.status)) return;
      setOffline(res.status === 0);
      setAnalytics(res.data);
    });
  }, [adminKey, check]);

  const topPaths = analytics?.page_events?.slice(0, 10) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted" /> Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offline ? (
          <p className="text-sm text-muted">
            Backend unreachable. Start it and refresh.
          </p>
        ) : analytics === null ? (
          <div className="h-32 animate-pulse rounded-lg bg-line/50" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <TotalStat label="Events" value={analytics.totals.events} />
              <TotalStat label="Users" value={analytics.totals.users} />
              <TotalStat label="Pending" value={analytics.totals.experiences_pending} />
            </div>
            {topPaths.length > 0 && (
              <div className="mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPaths.map((p) => (
                      <TableRow key={p.path}>
                        <TableCell className="px-4 py-2.5 font-mono text-xs">{p.path}</TableCell>
                        <TableCell className="stat-num px-4 py-2.5 text-right font-medium text-ink">
                          {p.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TotalStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line p-3 text-center">
      <div className="stat-num text-2xl font-semibold text-ink">
        {value.toLocaleString("en-IN")}
      </div>
      <div className="text-xs uppercase tracking-wider text-muted">{label}</div>
    </div>
  );
}
