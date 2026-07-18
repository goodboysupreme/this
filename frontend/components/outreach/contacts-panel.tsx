"use client";

import { useRef, useState } from "react";
import { Download, Loader2, Trash2, UploadCloud, Users } from "lucide-react";
import type { ContactImportResult, OutreachContact } from "@/lib/types";
import { deleteOutreachContact, importContactsCSV } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OfflineState } from "@/components/OfflineState";

const SAMPLE_CSV =
  "data:text/csv;charset=utf-8," +
  encodeURIComponent(
    "name,role,company,email\nPriya Sharma,SDE II,Google,priya.sharma@example.com\nRahul Verma,Alumni Recruiter,Microsoft,rahul.verma@example.com"
  );

export function ContactsPanel({
  contacts,
  loaded,
  onChanged,
}: {
  contacts: OutreachContact[] | null;
  loaded: boolean;
  onChanged: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ContactImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function upload(file: File | undefined | null) {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    setImportResult(null);
    const res = await importContactsCSV(file);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res) {
      setError("Import failed — the backend may be offline.");
      return;
    }
    setImportResult(res);
    await onChanged();
  }

  async function remove(id: number) {
    setDeletingId(id);
    const ok = await deleteOutreachContact(id);
    setDeletingId(null);
    if (!ok) {
      setError("Delete failed — the backend may be offline.");
      return;
    }
    await onChanged();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import contacts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" /> Upload CSV
                </>
              )}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => upload(e.target.files?.[0])}
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Columns: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-white/10">name,role,company,email</code>{" "}
              —{" "}
              <a
                href={SAMPLE_CSV}
                download="contacts-sample.csv"
                className="inline-flex items-center gap-1 font-medium text-indigo-500 hover:underline dark:text-indigo-300"
              >
                <Download className="h-3.5 w-3.5" /> sample CSV
              </a>
            </p>
          </div>
          {importResult && (
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
              Imported {importResult.imported} contact{importResult.imported === 1 ? "" : "s"}
              {importResult.skipped > 0 &&
                ` · skipped ${importResult.skipped} invalid/duplicate row${importResult.skipped === 1 ? "" : "s"}`}
              .
            </p>
          )}
          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {contacts === null ? (
        loaded ? (
          <OfflineState what="your contacts" />
        ) : null
      ) : contacts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
              <Users className="h-6 w-6 text-indigo-400" />
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">No contacts yet</p>
            <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Upload a CSV above to build your outreach list.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {c.name}
                  </TableCell>
                  <TableCell>{c.role}</TableCell>
                  <TableCell>{c.company}</TableCell>
                  <TableCell className="text-zinc-500 dark:text-zinc-400">{c.email}</TableCell>
                  <TableCell className="text-right">
                    <button
                      aria-label={`Delete ${c.name}`}
                      onClick={() => remove(c.id)}
                      disabled={deletingId === c.id}
                      className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                    >
                      {deletingId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
