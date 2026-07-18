"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Building2, MessageSquareQuote, Search, Send } from "lucide-react";
import { getCompanies, getExperiences, submitExperience } from "@/lib/api";
import type { CompanySummary, ExperienceRow, OfferType } from "@/lib/types";
import { TYPE_LABELS, cn } from "@/lib/utils";
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
      <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
        <MessageSquareQuote className="h-8 w-8 text-violet-400" />
        Experience Bank
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-500 dark:text-zinc-400">
        Real interview and PS experiences from BITS seniors. Browse what&apos;s approved, or add
        your own — submissions go live after moderation.
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
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              type === t
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                : "border border-zinc-300 text-zinc-600 hover:border-indigo-400/50 dark:border-white/15 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {t === "all" ? "All" : TYPE_LABELS[t]}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              The backend is offline, so experiences can&apos;t be loaded right now. Start it at{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-white/10">
                http://localhost:8000
              </code>{" "}
              and refresh.
            </CardContent>
          </Card>
        ) : experiences === null ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-zinc-200/40 dark:bg-white/5" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No approved experiences match — be the first to share yours.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((e) => (
              <Card key={e.id}>
                <CardContent className="py-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="indigo">{TYPE_LABELS[e.type] ?? e.type}</Badge>
                    <Badge variant="outline">{e.year}</Badge>
                    <Link
                      href={`/company/${e.company_slug}`}
                      className="text-sm font-medium text-indigo-500 hover:underline dark:text-indigo-300"
                    >
                      {e.company_name}
                    </Link>
                    {e.author_hint && (
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">{e.author_hint}</span>
                    )}
                  </div>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {e.content}
                  </p>
                </CardContent>
              </Card>
            ))}
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
          ? "Can’t reach the backend right now — try again once it’s up."
          : "Submission was rejected — check the fields and try again."
      );
    }
  }

  return (
    <section>
      <Card>
        <CardContent className="py-6">
          <h2 className="font-display text-lg font-semibold text-zinc-900 dark:text-white">
            Share your experience
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Reviewed before publishing — keep it factual and helpful for juniors.
          </p>

          {status === "done" && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-300">
              Submitted for moderation — thanks for contributing!
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
            {/* Company search-select */}
            <div ref={boxRef} className="relative">
              <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Company
              </span>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#12121c]">
                  {matches.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(c);
                          setDropdownOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
                      >
                        <span>{c.name}</span>
                        <span className="text-xs text-zinc-400">{c.sector}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {dropdownOpen && matches.length === 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500 shadow-xl dark:border-white/10 dark:bg-[#12121c] dark:text-zinc-400">
                  No matching companies.
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</span>
                <Select value={type} onChange={(e) => setType(e.target.value as OfferType)}>
                  {(Object.keys(TYPE_LABELS) as OfferType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Year</span>
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
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Author hint <span className="font-normal text-zinc-400">(optional)</span>
              </span>
              <Input
                value={authorHint}
                onChange={(e) => setAuthorHint(e.target.value)}
                placeholder="e.g. 2024 batch, ECE"
                maxLength={80}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Experience
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={7}
                placeholder="Rounds, questions asked, what mattered, tips for juniors…"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <span
                className={cn(
                  "text-xs",
                  contentValid ? "text-zinc-400" : "text-amber-500"
                )}
              >
                {contentLen}/{CONTENT_MAX} — minimum {CONTENT_MIN} characters
              </span>
            </label>

            <Button type="submit" variant="glow" disabled={status === "sending"}>
              <Send className="h-4 w-4" />
              {status === "sending" ? "Submitting…" : "Submit for moderation"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
