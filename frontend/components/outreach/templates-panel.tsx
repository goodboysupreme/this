"use client";

import { useState } from "react";
import { FileText, Loader2, Plus } from "lucide-react";
import type { OutreachTemplate } from "@/lib/types";
import { createOutreachTemplate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OfflineState } from "@/components/OfflineState";

const textareaClass =
  "w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export function TemplatesPanel({
  templates,
  loaded,
  onChanged,
}: {
  templates: OutreachTemplate[] | null;
  loaded: boolean;
  onChanged: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim() || !subject.trim() || !body.trim() || saving) return;
    setSaving(true);
    setError(null);
    const res = await createOutreachTemplate({
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
    });
    setSaving(false);
    if (!res) {
      setError("Couldn't save the template — the backend may be offline.");
      return;
    }
    setName("");
    setSubject("");
    setBody("");
    await onChanged();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New template</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            placeholder="Template name — e.g. Alumni referral ask"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <Input
            placeholder="Subject — e.g. Referral request for {company}"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={saving}
          />
          <textarea
            rows={7}
            placeholder={"Hi {name},\n\nI'm a final-year student at BITS Pilani…"}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={saving}
            className={textareaClass}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Placeholders: <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-white/10">{"{name}"}</code>{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-white/10">{"{company}"}</code>{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-white/10">{"{role}"}</code>{" "}
            — replaced per contact when sending.
          </p>
          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          )}
          <div>
            <Button
              variant="glow"
              onClick={save}
              disabled={!name.trim() || !subject.trim() || !body.trim() || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Save template
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {templates === null ? (
        loaded ? (
          <OfflineState what="your templates" />
        ) : null
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
              <FileText className="h-6 w-6 text-indigo-400" />
            </span>
            <p className="font-medium text-zinc-800 dark:text-zinc-200">No templates yet</p>
            <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
              Create your first outreach template above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id} className="h-full">
              <CardHeader>
                <CardTitle className="text-base">{t.name}</CardTitle>
                <p className="text-sm font-medium text-indigo-500 dark:text-indigo-300">
                  {t.subject}
                </p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
                  {t.body.length > 280 ? `${t.body.slice(0, 280)}…` : t.body}
                </p>
                {t.created_at && (
                  <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                    Created {new Date(t.created_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
