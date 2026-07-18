import type { Metadata } from "next";
import { Building2, CalendarDays, Database, Gauge, Info, Layers, MessageSquareQuote, TrendingUp } from "lucide-react";
import { getCompany } from "@/lib/api";
import type { CutoffPrediction } from "@/lib/types";
import {
  TYPE_LABELS,
  formatCompensation,
  formatCutoff,
  sortOffersByYearDesc,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { FadeIn } from "@/components/FadeIn";
import { FavoriteButton } from "@/components/favorite-button";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const company = await getCompany(params.slug);
  return {
    title: company ? company.name : "Company",
    description: company
      ? `${company.name} at BITS Pilani — offers, CGPA cutoffs, stipends/CTCs and interview experiences on PlaceIQ.`
      : "Company placement intelligence on PlaceIQ.",
    openGraph: company ? { title: `${company.name} | PlaceIQ` } : undefined,
  };
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const company = await getCompany(params.slug);

  if (company === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <OfflineState what="this company profile" />
      </div>
    );
  }

  const offers = sortOffersByYearDesc(company.offers ?? []);
  const cutoffs = offers.map((o) => o.cgpa_cutoff).filter((c): c is number => c !== null);
  const statChips = [
    { icon: Database, label: `${offers.length} offer${offers.length === 1 ? "" : "s"} on record` },
    offers.length > 0 && { icon: CalendarDays, label: `Latest: ${offers[0].year}` },
    cutoffs.length > 0 && {
      icon: Gauge,
      label: `Cutoffs ${Math.min(...cutoffs).toFixed(2)} – ${Math.max(...cutoffs).toFixed(2)}`,
    },
    {
      icon: Layers,
      label: [...new Set(offers.map((o) => TYPE_LABELS[o.type] ?? o.type))].join(" · ") || "—",
    },
  ].filter(Boolean) as { icon: typeof Database; label: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-wrap items-start gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
            <Building2 className="h-8 w-8 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {company.name}
              </h1>
              {company.sector && <Badge variant="violet">{company.sector}</Badge>}
            </div>
            {company.description && (
              <p className="mt-3 max-w-3xl text-zinc-500 dark:text-zinc-400">{company.description}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {statChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300"
                >
                  <chip.icon className="h-3.5 w-3.5 text-indigo-400" />
                  {chip.label}
                </span>
              ))}
            </div>
          </div>
          <FavoriteButton slug={company.slug} initialFavorited={company.is_favorited ?? false} />
        </div>
      </FadeIn>

      {/* Cutoff predictors */}
      {company.cutoff_predictions?.length > 0 && (
        <div className="mt-10">
          <FadeIn delay={0.05}>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
              <TrendingUp className="h-5 w-5 text-indigo-400" /> Expected CGPA cutoff
            </h2>
          </FadeIn>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {company.cutoff_predictions.map((p, i) => (
              <FadeIn key={p.type} delay={0.08 * i}>
                <PredictorCard prediction={p} />
              </FadeIn>
            ))}
          </div>
        </div>
      )}

      {/* Offers table */}
      <FadeIn delay={0.1}>
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Offers by year</CardTitle>
          </CardHeader>
          {offers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>CG cutoff</TableHead>
                  <TableHead>Stipend / CTC</TableHead>
                  <TableHead className="text-right">Slots</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.year}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{TYPE_LABELS[o.type] ?? o.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{o.role}</span>
                        {o.role_category && (
                          <span className="text-xs text-zinc-400 dark:text-zinc-500">{o.role_category}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{o.branch || "—"}</TableCell>
                    <TableCell className="font-mono">{formatCutoff(o.cgpa_cutoff)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCompensation(o.type, o.stipend_ctc)}
                    </TableCell>
                    <TableCell className="text-right">{o.slots ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <CardContent className="py-8 text-center text-sm text-zinc-500">
              No offers on record for this company yet.
            </CardContent>
          )}
        </Card>
      </FadeIn>

      {/* Experiences */}
      <FadeIn delay={0.15}>
        <div className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-zinc-900 dark:text-white">
            <MessageSquareQuote className="h-5 w-5 text-violet-400" /> Interview experiences
          </h2>
          {company.experiences?.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {company.experiences.map((e) => (
                <Card key={e.id}>
                  <CardContent className="py-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant="indigo">{TYPE_LABELS[e.type] ?? e.type}</Badge>
                      <Badge variant="outline">{e.year}</Badge>
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
          ) : (
            <Card className="mt-4 border-dashed">
              <CardContent className="py-8 text-center text-sm text-zinc-500">
                No approved experiences yet — the experience bank opens in Phase 2.
              </CardContent>
            </Card>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

const SCALE_MIN = 5;
const SCALE_MAX = 10;
const pct = (v: number) =>
  Math.min(100, Math.max(0, ((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));

function PredictorCard({ prediction: p }: { prediction: CutoffPrediction }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/[0.06] via-transparent to-violet-500/[0.06]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
      <CardContent className="relative py-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {TYPE_LABELS[p.type] ?? p.type}
          </span>
          <span
            className="cursor-help text-zinc-400 hover:text-indigo-400"
            title={`Estimate, not official data. Basis: ${p.basis} (n=${p.sample_size}).`}
          >
            <Info className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 font-display text-3xl font-bold text-zinc-900 dark:text-white">
          {p.expected_cutoff.toFixed(2)}
        </div>
        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          likely band{" "}
          <span className="font-medium text-indigo-500 dark:text-indigo-300">
            {p.band[0].toFixed(2)} – {p.band[1].toFixed(2)}
          </span>
        </div>

        {/* band gauge on the 5–10 CGPA scale */}
        <div className="mt-4">
          <div className="relative h-2 rounded-full bg-zinc-200 dark:bg-white/10">
            <div
              className="absolute inset-y-0 rounded-full bg-gradient-to-r from-indigo-500/50 to-violet-500/50"
              style={{ left: `${pct(p.band[0])}%`, width: `${pct(p.band[1]) - pct(p.band[0])}%` }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgb(99_102_241/0.8)]"
              style={{ left: `${pct(p.expected_cutoff)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
            <span>{SCALE_MIN}.0</span>
            <span>{SCALE_MAX}.0</span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-zinc-400 dark:text-zinc-500">
          Estimate, not official. Based on {p.sample_size} data point{p.sample_size === 1 ? "" : "s"}: {p.basis}
        </p>
      </CardContent>
    </Card>
  );
}
