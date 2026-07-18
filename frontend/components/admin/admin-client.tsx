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
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
        <KeyRound className="h-7 w-7 text-white" />
      </span>
      <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Admin access
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Enter the admin key to moderate experiences, upload datasets and view analytics.
      </p>
      <form
        onSubmit={submit}
        className="mt-8 w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:backdrop-blur-sm"
      >
        {invalid && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-300">
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
        <Button type="submit" variant="glow" className="mt-4 w-full">
          Unlock
        </Button>
      </form>
    </div>
  );
}

function AdminPanels({ adminKey, onForbidden }: { adminKey: string; onForbidden: () => void }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
        Admin console
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">
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
          {pending && pending.length > 0 && <Badge variant="warning">{pending.length}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offline ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Backend unreachable — start it and refresh.
          </p>
        ) : pending === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-zinc-200/40 dark:bg-white/5" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Nothing awaiting moderation.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pending.map((e) => (
              <div
                key={e.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-white/10"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="indigo">{TYPE_LABELS[e.type] ?? e.type}</Badge>
                  <Badge variant="outline">{e.year}</Badge>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {e.company_name}
                  </span>
                  {e.author_hint && (
                    <span className="text-xs text-zinc-400">{e.author_hint}</span>
                  )}
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
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
                    variant="outline"
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
      setError(res.status === 0 ? "Backend unreachable." : "Upload failed — check the file format.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-4 w-4 text-indigo-400" /> Dataset upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {result && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-300">
              Imported {result.imported} row{result.imported === 1 ? "" : "s"}, skipped{" "}
              {result.skipped}.
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Kind</span>
              <Select value={kind} onChange={(e) => setKind(e.target.value as DatasetKind)}>
                {DATASET_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k === "companies" ? "Companies" : TYPE_LABELS[k]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">CSV file</span>
              <input
                type="file"
                accept=".csv"
                onChange={onFile}
                className="text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-600 hover:file:bg-indigo-500/20 dark:text-zinc-400 dark:file:text-indigo-300"
              />
            </label>
          </div>
          <Button type="submit" variant="glow" disabled={busy} className="self-start">
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
          <BarChart3 className="h-4 w-4 text-violet-400" /> Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {offline ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Backend unreachable — start it and refresh.
          </p>
        ) : analytics === null ? (
          <div className="h-32 animate-pulse rounded-lg bg-zinc-200/40 dark:bg-white/5" />
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
                        <TableCell className="font-mono text-xs">{p.path}</TableCell>
                        <TableCell className="text-right font-medium">{p.count}</TableCell>
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
    <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-white/10">
      <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white">
        {value.toLocaleString("en-IN")}
      </div>
      <div className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
    </div>
  );
}
