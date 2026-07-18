"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GitCompareArrows, Search, X } from "lucide-react";
import { compareCompanies, getCompanies } from "@/lib/api";
import type { CompanyDetail, CompanySummary } from "@/lib/types";
import { TYPE_LABELS, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/FadeIn";
import { OfflineState } from "@/components/OfflineState";

export function CompareClient() {
  const [companies, setCompanies] = useState<CompanySummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CompanySummary[]>([]);
  const [results, setResults] = useState<CompanyDetail[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCompanies().then(setCompanies);
  }, []);

  const suggestions = useMemo(() => {
    if (!companies) return [];
    const q = search.trim().toLowerCase();
    return companies
      .filter((c) => !selected.some((s) => s.slug === c.slug))
      .filter((c) => !q || c.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [companies, search, selected]);

  const add = (c: CompanySummary) => {
    if (selected.length >= 3) return;
    setSelected((s) => [...s, c]);
    setSearch("");
  };

  const remove = (slug: string) => setSelected((s) => s.filter((c) => c.slug !== slug));

  const compare = async () => {
    setLoading(true);
    const res = await compareCompanies(selected.map((c) => c.slug));
    setResults(res);
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <FadeIn>
        <h1 className="flex items-center gap-3 font-display text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
          <GitCompareArrows className="h-9 w-9 text-indigo-400" /> Compare companies
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-500 dark:text-zinc-400">
          Pick 2–3 companies to see offers, compensation and cutoff predictions side by side.
        </p>
      </FadeIn>

      {companies === null ? (
        <div className="mt-10">
          <OfflineState what="the company list" />
        </div>
      ) : (
        <>
          <FadeIn delay={0.1}>
            <Card className="mt-8">
              <CardContent className="py-5">
                <div className="flex flex-wrap items-center gap-3">
                  {selected.map((c) => (
                    <Badge key={c.slug} variant="indigo" className="px-3 py-1.5 text-sm">
                      {c.name}
                      <button aria-label={`Remove ${c.name}`} onClick={() => remove(c.slug)}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </Badge>
                  ))}
                  {selected.length < 3 && (
                    <div className="relative min-w-[220px] flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        className="pl-9"
                        placeholder={
                          selected.length === 0 ? "Search companies to compare…" : "Add another…"
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {suggestions.length > 0 && (
                        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-zinc-900">
                          {suggestions.map((c) => (
                            <button
                              key={c.slug}
                              onClick={() => add(c)}
                              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5"
                            >
                              <span>{c.name}</span>
                              <span className="text-xs text-zinc-400">{c.sector}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    variant="glow"
                    disabled={selected.length < 2 || loading}
                    onClick={compare}
                  >
                    {loading ? "Comparing…" : "Compare"}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                  {selected.length}/3 selected — pick at least 2.
                </p>
              </CardContent>
            </Card>
          </FadeIn>

          {results !== null && results.length === 0 && (
            <p className="mt-8 text-center text-sm text-zinc-500">
              No data returned for those companies.
            </p>
          )}

          {results !== null && results.length > 0 && (
            <div
              className={cn(
                "mt-8 grid gap-6",
                results.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
              )}
            >
              {results.map((c, i) => (
                <FadeIn key={c.slug} delay={i * 0.08}>
                  <CompanyCompareCard company={c} />
                </FadeIn>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CompanyCompareCard({ company: c }: { company: CompanyDetail }) {
  const offers = c.offers ?? [];
  const latestYear = offers.length ? Math.max(...offers.map((o) => o.year)) : null;
  const cutoffs = offers
    .map((o) => o.cgpa_cutoff)
    .filter((v): v is number => v !== null);
  const minCutoff = cutoffs.length ? Math.min(...cutoffs) : null;

  return (
    <Card className="relative h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>
            <Link href={`/company/${c.slug}`} className="hover:text-indigo-400 hover:underline">
              {c.name}
            </Link>
          </CardTitle>
          {c.sector && <Badge variant="violet">{c.sector}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat label="Offers" value={String(offers.length)} />
          <MiniStat label="Latest year" value={latestYear ? String(latestYear) : "—"} />
          <MiniStat label="Lowest cutoff" value={minCutoff !== null ? minCutoff.toFixed(2) : "—"} />
        </div>

        {c.cutoff_predictions?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Expected cutoffs
            </p>
            <div className="flex flex-col gap-2">
              {c.cutoff_predictions.map((p) => (
                <div
                  key={p.type}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-sm dark:border-white/5"
                >
                  <span className="text-zinc-500 dark:text-zinc-400">{TYPE_LABELS[p.type] ?? p.type}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {p.expected_cutoff.toFixed(2)}{" "}
                    <span className="text-xs text-zinc-400">
                      ({p.band[0].toFixed(1)}–{p.band[1].toFixed(1)})
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
              Estimates, not official data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 py-3 dark:bg-white/[0.03]">
      <div className="font-display text-xl font-bold text-zinc-900 dark:text-white">{value}</div>
      <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</div>
    </div>
  );
}
