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
  "w-full resize-y rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50";

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
      setError("Couldn't save the template. The backend may be offline.");
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
            placeholder="Template name, e.g. Alumni referral ask"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
          <Input
            placeholder="Subject, e.g. Referral request for {company}"
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
          <p className="text-xs text-muted">
            Placeholders: <code className="rounded bg-line/60 px-1.5 py-0.5">{"{name}"}</code>{" "}
            <code className="rounded bg-line/60 px-1.5 py-0.5">{"{company}"}</code>{" "}
            <code className="rounded bg-line/60 px-1.5 py-0.5">{"{role}"}</code>, replaced per
            contact when sending.
          </p>
          {error && (
            <p className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          <div>
            <Button
              variant="default"
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
            <span className="flex h-12 w-12 items-center justify-center rounded-md border border-line bg-surface text-muted">
              <FileText className="h-6 w-6" />
            </span>
            <p className="font-medium text-ink">No templates yet</p>
            <p className="max-w-md text-sm text-muted">
              Create your first outreach template above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {templates.map((t) => (
            <div key={t.id} className="px-4 py-4 sm:px-6">
              <p className="font-medium text-ink">{t.name}</p>
              <p className="mt-0.5 text-sm text-muted">{t.subject}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {t.body.length > 280 ? `${t.body.slice(0, 280)}…` : t.body}
              </p>
              {t.created_at && (
                <p className="mt-2 text-xs text-muted">
                  Created {new Date(t.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
