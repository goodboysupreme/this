"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Building2, Search, Send } from "lucide-react";
import { getCompanies, getExperiences, submitExperience } from "@/lib/api";
import type { CompanySummary, ExperienceRow, OfferType } from "@/lib/types";
import { TYPE_LABELS, cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { OfflineState } from "@/components/OfflineState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const TYPE_FILTERS: (OfferType | "all")[] = ["all", "placement", "ps1", "ps2", "si"];
const CONTENT_MIN = 20;
const CONTENT_MAX = 5000;

export function ExperiencesClient() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Experience Bank
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Real interview and PS experiences from BITS seniors. Browse what&apos;s approved, or add
        your own. Submissions go live after moderation.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <BrowseSection />
        <SubmitSection />
      </div>
    </div>
  );
}

/* ---------- Browse ---------- */

function BrowseSection() {
  const [type, setType] = useState<OfferType | "all">("all");
  const [search, setSearch] = useState("");
  const [experiences, setExperiences] = useState<ExperienceRow[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setExperiences(null);
    getExperiences({ type: type === "all" ? undefined : type, limit: 200 }).then((rows) => {
      if (cancelled) return;
      setOffline(rows === null);
      setExperiences(rows ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const filtered = useMemo(() => {
    if (!experiences) return [];
    const q = search.trim().toLowerCase();
    if (!q) return experiences;
    return experiences.filter((e) => e.company_name.toLowerCase().includes(q));
  }, [experiences, search]);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              type === t
                ? "bg-accent text-white"
                : "border border-line text-muted hover:text-ink"
            )}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by company…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-6">
        {offline ? (
          <OfflineState what="experiences" />
        ) : experiences === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-line/50" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent>
              <EmptyState
                title="No approved experiences match"
                description="Be the first to share yours."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="divide-y divide-line">
              {filtered.map((e) => (
                <article key={e.id} className="px-4 py-4 sm:px-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{TYPE_LABELS[e.type] ?? e.type}</Badge>
                    <Badge variant="outline" className="stat-num">
                      {e.year}
                    </Badge>
                    <Link
                      href={`/company/${e.company_slug}`}
                      className="text-sm font-medium text-ink transition-colors hover:text-accent"
                    >
                      {e.company_name}
                    </Link>
                    {e.author_hint && (
                      <span className="text-xs text-muted">{e.author_hint}</span>
                    )}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                    {e.content}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Submit ---------- */

function SubmitSection() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selected, setSelected] = useState<CompanySummary | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [type, setType] = useState<OfferType>("placement");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [authorHint, setAuthorHint] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCompanies().then((c) => setCompanies(c ?? []));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const matches = useMemo(() => {
    const q = companyQuery.trim().toLowerCase();
    if (!q) return companies.slice(0, 8);
    return companies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [companies, companyQuery]);

  const contentLen = content.trim().length;
  const contentValid = contentLen >= CONTENT_MIN && contentLen <= CONTENT_MAX;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected) {
      setError("Pick a company from the list first.");
      return;
    }
    if (!contentValid) {
      setError(`Experience must be ${CONTENT_MIN}–${CONTENT_MAX} characters (currently ${contentLen}).`);
      return;
    }
    setStatus("sending");
    const res = await submitExperience({
      company_slug: selected.slug,
      type,
      year: Number(year) || new Date().getFullYear(),
      author_hint: authorHint.trim(),
      content: content.trim(),
    });
    if (res.data?.ok) {
      setStatus("done");
      setSelected(null);
      setCompanyQuery("");
      setAuthorHint("");
      setContent("");
    } else {
      setStatus("error");
      setError(
        res.status === 0
          ? "Can’t reach the backend right now. Try again once it’s up."
          : "Submission was rejected. Check the fields and try again."
      );
    }
  }

  return (
    <section>
      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold tracking-tight text-ink">
            Share your experience
          </h2>
          <p className="mt-1 text-sm text-muted">
            Reviewed before publishing. Keep it factual and helpful for juniors.
          </p>

          {status === "done" && (
            <div className="mt-4 rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success">
              Submitted for moderation. Thanks for contributing!
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
            {/* Company search-select */}
            <div ref={boxRef} className="relative">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Company
              </span>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  value={selected ? selected.name : companyQuery}
                  placeholder="Search companies…"
                  className="pl-9"
                  onFocus={() => {
                    setDropdownOpen(true);
                    if (selected) {
                      setCompanyQuery("");
                      setSelected(null);
                    }
                  }}
                  onChange={(e) => {
                    setCompanyQuery(e.target.value);
                    setSelected(null);
                    setDropdownOpen(true);
                  }}
                />
              </div>
              {dropdownOpen && matches.length > 0 && (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-surface py-1">
                  {matches.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(c);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-line/60"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-muted">{c.sector}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {dropdownOpen && matches.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted">
                  No matching companies.
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Type</span>
                <Select value={type} onChange={(e) => setType(e.target.value as OfferType)}>
                  {(Object.keys(TYPE_LABELS) as OfferType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-ink">Year</span>
                <Input
                  type="number"
                  min={2010}
                  max={2100}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  required
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">
                Author hint <span className="font-normal text-muted">(optional)</span>
              </span>
              <Input
                value={authorHint}
                onChange={(e) => setAuthorHint(e.target.value)}
                placeholder="e.g. 2024 batch, ECE"
                maxLength={80}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">
                Experience
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                placeholder="Rounds, questions asked, what mattered, tips for juniors…"
                className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              />
              <span
                className={cn(
                  "stat-num text-xs",
                  contentValid ? "text-muted" : "text-warn"
                )}
              >
                {contentLen}/{CONTENT_MAX}, minimum {CONTENT_MIN} characters
              </span>
            </label>

            <Button type="submit" disabled={status === "sending"}>
              <Send className="h-4 w-4" />
              {status === "sending" ? "Submitting…" : "Submit for moderation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
