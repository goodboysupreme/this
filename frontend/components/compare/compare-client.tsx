"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { compareCompanies, getCompanies } from "@/lib/api";
import type { CompanyDetail, CompanySummary, OfferType } from "@/lib/types";
import { TYPE_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OfflineState } from "@/components/OfflineState";

export function CompareClient() {
  const [companies, setCompanies] = useState<CompanySummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CompanySummary[]>([]);
  const [results, setResults] = useState<CompanyDetail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

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
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Compare companies
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pick 2–3 companies to see offers, compensation and cutoff predictions side by side.
      </p>

      {companies === null ? (
        <div className="mt-10">
          <OfflineState what="the company list" />
        </div>
      ) : (
        <>
          <Card className="mt-8">
            <CardContent className="py-5">
              <div className="flex flex-wrap items-center gap-3">
                {selected.map((c) => (
                  <Badge key={c.slug} variant="accent" className="px-3 py-1.5 text-sm">
                    {c.name}
                    <button aria-label={`Remove ${c.name}`} onClick={() => remove(c.slug)}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
                {selected.length < 3 && (
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      className="pl-9"
                      placeholder={
                        selected.length === 0 ? "Search companies to compare…" : "Add another…"
                      }
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setTimeout(() => setFocused(false), 150)}
                    />
                    {focused && suggestions.length > 0 && (
                      <div className="absolute z-20 mt-2 w-full divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
                        {suggestions.map((c) => (
                          <button
                            key={c.slug}
                            onClick={() => add(c)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-line/40"
                          >
                            <span>{c.name}</span>
                            <span className="text-xs text-muted">{c.sector}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <Button disabled={selected.length < 2 || loading} onClick={compare}>
                  {loading ? "Comparing…" : "Compare"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted">
                <span className="stat-num">{selected.length}/3</span> selected. Pick at least 2.
              </p>
            </CardContent>
          </Card>

          {results !== null && results.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted">
              No data returned for those companies.
            </p>
          )}

          {results !== null && results.length > 0 && <CompareTable companies={results} />}
        </>
      )}
    </div>
  );
}

function CompareTable({ companies }: { companies: CompanyDetail[] }) {
  const stats = companies.map((c) => {
    const offers = c.offers ?? [];
    const latestYear = offers.length ? Math.max(...offers.map((o) => o.year)) : null;
    const cutoffs = offers
      .map((o) => o.cgpa_cutoff)
      .filter((v): v is number => v !== null);
    const minCutoff = cutoffs.length ? Math.min(...cutoffs) : null;
    return { offers: offers.length, latestYear, minCutoff };
  });

  const predTypes: OfferType[] = [];
  for (const c of companies) {
    for (const p of c.cutoff_predictions ?? []) {
      if (!predTypes.includes(p.type)) predTypes.push(p.type);
    }
  }

  return (
    <div className="mt-8 overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface">
            <th className="px-4 py-3 text-left font-medium text-muted">Metric</th>
            {companies.map((c) => (
              <th key={c.slug} className="px-4 py-3 text-right align-top">
                <Link
                  href={`/company/${c.slug}`}
                  className="font-semibold text-ink hover:text-accent hover:underline"
                >
                  {c.name}
                </Link>
                {c.sector && (
                  <div className="mt-1 flex justify-end">
                    <Badge variant="secondary">{c.sector}</Badge>
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          <tr>
            <td className="px-4 py-3 text-muted">Offers on record</td>
            {companies.map((c, i) => (
              <td key={c.slug} className="stat-num px-4 py-3 text-right font-medium text-ink">
                {stats[i].offers}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 text-muted">Latest year</td>
            {companies.map((c, i) => (
              <td key={c.slug} className="stat-num px-4 py-3 text-right font-medium text-ink">
                {stats[i].latestYear ?? "–"}
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-4 py-3 text-muted">Lowest CGPA cutoff</td>
            {companies.map((c, i) => (
              <td key={c.slug} className="stat-num px-4 py-3 text-right font-medium text-ink">
                {stats[i].minCutoff !== null ? stats[i].minCutoff.toFixed(2) : "–"}
              </td>
            ))}
          </tr>
          {predTypes.map((t) => (
            <tr key={t}>
              <td className="px-4 py-3 text-muted">
                Expected cutoff: {TYPE_LABELS[t] ?? t}
                <span className="block text-xs">estimate</span>
              </td>
              {companies.map((c) => {
                const p = c.cutoff_predictions?.find((x) => x.type === t);
                return (
                  <td key={c.slug} className="stat-num px-4 py-3 text-right font-medium text-ink">
                    {p ? (
                      <>
                        {p.expected_cutoff.toFixed(2)}{" "}
                        <span className="text-xs font-normal text-muted">
                          ({p.band[0].toFixed(1)}–{p.band[1].toFixed(1)})
                        </span>
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {predTypes.length > 0 && (
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          Expected cutoffs are statistical estimates, not official data.
        </p>
      )}
    </div>
  );
}
