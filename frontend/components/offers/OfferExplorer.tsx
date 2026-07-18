"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search, SlidersHorizontal, X, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { OfferRow, OfferType } from "@/lib/types";
import {
  cn,
  compensationLabel,
  formatCompensation,
  formatCutoff,
  sortOffersByYearDesc,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { OfflineState } from "@/components/OfflineState";
import { EmptyState } from "@/components/EmptyState";

type SortKey = "company" | "cutoff" | "comp" | "year";
type SortDir = "asc" | "desc";

interface Filters {
  year: string;
  branch: string;
  roleCategory: string;
  minCg: string;
  maxCg: string;
  search: string;
}

const EMPTY: Filters = { year: "", branch: "", roleCategory: "", minCg: "", maxCg: "", search: "" };

export function OfferExplorer({
  type,
  title,
  description,
  offers,
}: {
  type: OfferType;
  title: string;
  description: string;
  offers: OfferRow[] | null;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const set = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters((f) => ({ ...f, [k]: e.target.value }));

  const clearFilter = (k: keyof Filters) => setFilters((f) => ({ ...f, [k]: "" }));

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }
    );

  const years = useMemo(
    () => [...new Set((offers ?? []).map((o) => o.year))].sort((a, b) => b - a),
    [offers]
  );
  const branches = useMemo(
    () => [...new Set((offers ?? []).map((o) => o.branch).filter(Boolean))].sort(),
    [offers]
  );
  const roleCategories = useMemo(
    () => [...new Set((offers ?? []).map((o) => o.role_category).filter(Boolean))].sort(),
    [offers]
  );

  const filtered = useMemo(() => {
    if (!offers) return [];
    const minCg = parseFloat(filters.minCg);
    const maxCg = parseFloat(filters.maxCg);
    const q = filters.search.trim().toLowerCase();
    const rows = offers.filter((o) => {
      if (filters.year && o.year !== Number(filters.year)) return false;
      if (filters.branch && o.branch !== filters.branch) return false;
      if (filters.roleCategory && o.role_category !== filters.roleCategory) return false;
      if (!Number.isNaN(minCg) && (o.cgpa_cutoff === null || o.cgpa_cutoff < minCg)) return false;
      if (!Number.isNaN(maxCg) && (o.cgpa_cutoff === null || o.cgpa_cutoff > maxCg)) return false;
      if (q && !`${o.company_name} ${o.role} ${o.role_category}`.toLowerCase().includes(q))
        return false;
      return true;
    });
    if (!sort) return sortOffersByYearDesc(rows);
    const mul = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sort.key) {
        case "company":
          return mul * a.company_name.localeCompare(b.company_name);
        case "cutoff":
          return mul * ((a.cgpa_cutoff ?? -1) - (b.cgpa_cutoff ?? -1));
        case "comp":
          return mul * ((a.stipend_ctc ?? -1) - (b.stipend_ctc ?? -1));
        case "year":
          return mul * (a.year - b.year);
      }
    });
  }, [offers, filters, sort]);

  const offersByYear = useMemo(() => {
    const map = new Map<number, number>();
    for (const o of filtered) map.set(o.year, (map.get(o.year) ?? 0) + 1);
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year: String(year), count }));
  }, [filtered]);

  const cutoffDist = useMemo(() => {
    const bins = new Map<string, number>();
    for (const o of filtered) {
      if (o.cgpa_cutoff === null) continue;
      const low = Math.floor(o.cgpa_cutoff * 2) / 2;
      const label = `${low.toFixed(1)}–${(low + 0.5).toFixed(1)}`;
      bins.set(label, (bins.get(label) ?? 0) + 1);
    }
    return [...bins.entries()]
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([range, count]) => ({ range, count }));
  }, [filtered]);

  const activeFilters =
    (filters.year ? 1 : 0) +
    (filters.branch ? 1 : 0) +
    (filters.roleCategory ? 1 : 0) +
    (filters.minCg ? 1 : 0) +
    (filters.maxCg ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{description}</p>
        </div>
        {offers && (
          <Badge variant="accent" className="stat-num text-sm">
            {filtered.length} of {offers.length} offers
          </Badge>
        )}
      </div>

      {offers === null ? (
        <div className="mt-10">
          <OfflineState what={`${title.toLowerCase()} offers`} />
        </div>
      ) : (
        <>
          {/* Filter bar */}
          <div className="sticky top-[68px] z-30 mt-8">
            <Card>
              <CardContent className="flex flex-wrap items-center gap-3 py-4">
                <span className="flex items-center gap-2 text-sm font-medium text-muted">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {activeFilters > 0 && (
                    <Badge variant="accent" className="stat-num">
                      {activeFilters}
                    </Badge>
                  )}
                </span>
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <Input
                    className="pl-9"
                    placeholder="Search company or role…"
                    value={filters.search}
                    onChange={set("search")}
                  />
                </div>
                <Select className="w-32" value={filters.year} onChange={set("year")}>
                  <option value="">All years</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Select>
                <Select className="w-44" value={filters.branch} onChange={set("branch")}>
                  <option value="">All branches</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
                <Select className="w-44" value={filters.roleCategory} onChange={set("roleCategory")}>
                  <option value="">All role types</option>
                  {roleCategories.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    className="w-24"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Min CG"
                    value={filters.minCg}
                    onChange={set("minCg")}
                  />
                  <span className="text-muted">–</span>
                  <Input
                    className="w-24"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Max CG"
                    value={filters.maxCg}
                    onChange={set("maxCg")}
                  />
                </div>
                {activeFilters > 0 && (
                  <button
                    onClick={() => setFilters(EMPTY)}
                    className="text-sm font-medium text-accent hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </CardContent>
              {activeFilters > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-2.5">
                  {(
                    [
                      ["year", filters.year && `Year ${filters.year}`],
                      ["branch", filters.branch],
                      ["roleCategory", filters.roleCategory],
                      ["minCg", filters.minCg && `CG ≥ ${filters.minCg}`],
                      ["maxCg", filters.maxCg && `CG ≤ ${filters.maxCg}`],
                      ["search", filters.search && `“${filters.search}”`],
                    ] as [keyof Filters, string | false][]
                  )
                    .filter(([, label]) => Boolean(label))
                    .map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => clearFilter(key)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
                      >
                        {label}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                </div>
              )}
            </Card>
          </div>

          {/* Charts */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offers by year</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {offersByYear.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={offersByYear}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--line))" opacity={0.4} />
                      <XAxis dataKey="year" stroke="oklch(var(--muted))" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="oklch(var(--muted))" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(var(--accent) / 0.08)" }} />
                      <Bar dataKey="count" fill="oklch(var(--accent))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">CGPA cutoff distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                {cutoffDist.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cutoffDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--line))" opacity={0.4} />
                      <XAxis dataKey="range" stroke="oklch(var(--muted))" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="oklch(var(--muted))" fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(var(--accent) / 0.08)" }} />
                      <Bar dataKey="count" fill="oklch(var(--accent))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="mt-6">
            <Table>
              <TableHeader>
                <TableRow className="even:bg-transparent hover:bg-transparent dark:even:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="sticky left-0 z-10 bg-surface">
                    <SortButton label="Company" active={sort} k="company" onToggle={toggleSort} />
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead className="text-right">
                    <SortButton label="CG cutoff" active={sort} k="cutoff" onToggle={toggleSort} className="ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton label={compensationLabel(type)} active={sort} k="comp" onToggle={toggleSort} className="ml-auto" />
                  </TableHead>
                  <TableHead className="text-right">
                    <SortButton label="Year" active={sort} k="year" onToggle={toggleSort} className="ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_td]:py-2.5">
                {filtered.slice(0, 200).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="sticky left-0 z-10 bg-surface">
                      <Link
                        href={`/company/${o.company_slug}`}
                        className="font-medium text-ink transition-colors hover:text-accent"
                      >
                        {o.company_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{o.role}</span>
                        {o.role_category && (
                          <span className="text-xs text-muted">{o.role_category}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{o.branch || "–"}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "stat-num",
                          o.cgpa_cutoff !== null && o.cgpa_cutoff >= 8.5 ? "text-warn" : ""
                        )}
                      >
                        {formatCutoff(o.cgpa_cutoff)}
                      </span>
                    </TableCell>
                    <TableCell className="stat-num text-right font-medium">
                      {formatCompensation(type, o.stipend_ctc)}
                    </TableCell>
                    <TableCell className="stat-num text-right text-muted">{o.year}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No offers match these filters"
                        description="Try widening the CGPA range or clearing a filter. The dataset only includes offers on record."
                      >
                        <button
                          onClick={() => setFilters(EMPTY)}
                          className="mt-1 text-sm font-medium text-accent hover:underline"
                        >
                          Clear all filters
                        </button>
                      </EmptyState>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filtered.length > 200 && (
              <p className="border-t border-line px-4 py-3 text-xs text-muted">
                Showing first <span className="stat-num">200</span> of{" "}
                <span className="stat-num">{filtered.length}</span> results. Narrow the filters to
                see more.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "oklch(var(--surface))",
  border: "1px solid oklch(var(--line))",
  borderRadius: "0.5rem",
  color: "oklch(var(--ink))",
  fontSize: "0.8rem",
};

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted">
      No data for the current filters.
    </div>
  );
}

function SortButton({
  label,
  active,
  k,
  onToggle,
  className,
}: {
  label: string;
  active: { key: SortKey; dir: SortDir } | null;
  k: SortKey;
  onToggle: (k: SortKey) => void;
  className?: string;
}) {
  const Icon = active?.key === k ? (active.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      onClick={() => onToggle(k)}
      className={cn(
        "inline-flex items-center gap-1 uppercase tracking-wider transition-colors hover:text-ink",
        active?.key === k && "text-accent",
        className
      )}
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}
