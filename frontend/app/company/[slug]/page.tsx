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
      ? `${company.name} at BITS Pilani: offers, CGPA cutoffs, stipends/CTCs and interview experiences on PlaceIQ.`
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
      <div className="flex flex-wrap items-start gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-line bg-surface">
          <Building2 className="h-8 w-8 text-muted" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              {company.name}
            </h1>
            {company.sector && <Badge variant="secondary">{company.sector}</Badge>}
          </div>
          {company.description && (
            <p className="mt-3 max-w-3xl text-muted">{company.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {statChips.map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-muted"
              >
                <chip.icon className="h-3.5 w-3.5 text-muted" />
                <span className="stat-num">{chip.label}</span>
              </span>
            ))}
          </div>
        </div>
        <FavoriteButton slug={company.slug} initialFavorited={company.is_favorited ?? false} />
      </div>

      {/* Cutoff predictors */}
      {company.cutoff_predictions?.length > 0 && (
        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
            <TrendingUp className="h-4 w-4 text-muted" /> Expected CGPA cutoff
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {company.cutoff_predictions.map((p) => (
              <PredictorCard key={p.type} prediction={p} />
            ))}
          </div>
        </div>
      )}

      {/* Offers table */}
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Offers by year</CardTitle>
        </CardHeader>
        {offers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Year</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="text-right">CG cutoff</TableHead>
                <TableHead className="text-right">Stipend / CTC</TableHead>
                <TableHead className="text-right">Slots</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="stat-num text-right font-medium">{o.year}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TYPE_LABELS[o.type] ?? o.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{o.role}</span>
                      {o.role_category && (
                        <span className="text-xs text-muted">{o.role_category}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{o.branch || "—"}</TableCell>
                  <TableCell className="stat-num text-right">{formatCutoff(o.cgpa_cutoff)}</TableCell>
                  <TableCell className="stat-num text-right">
                    {formatCompensation(o.type, o.stipend_ctc)}
                  </TableCell>
                  <TableCell className="stat-num text-right">{o.slots ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CardContent className="py-8 text-center text-sm text-muted">
            No offers on record for this company yet.
          </CardContent>
        )}
      </Card>

      {/* Experiences */}
      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <MessageSquareQuote className="h-4 w-4 text-muted" /> Interview experiences
        </h2>
        {company.experiences?.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="divide-y divide-line">
              {company.experiences.map((e) => (
                <div key={e.id} className="px-4 py-4 sm:px-6 sm:py-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="accent">{TYPE_LABELS[e.type] ?? e.type}</Badge>
                    <Badge variant="outline" className="stat-num">{e.year}</Badge>
                    {e.author_hint && (
                      <span className="text-xs text-muted">{e.author_hint}</span>
                    )}
                  </div>
                  <p className="max-w-prose whitespace-pre-line text-sm leading-relaxed text-muted">
                    {e.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="mt-4">
            <CardContent className="py-8 text-center text-sm text-muted">
              No approved experiences yet. The experience bank opens in Phase 2.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

const SCALE_MIN = 5;
const SCALE_MAX = 10;
const pct = (v: number) =>
  Math.min(100, Math.max(0, ((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100));

function PredictorCard({ prediction: p }: { prediction: CutoffPrediction }) {
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">
            {TYPE_LABELS[p.type] ?? p.type}
          </span>
          <span
            className="cursor-help text-muted transition-colors duration-150 hover:text-ink"
            title={`Estimate, not official data. Basis: ${p.basis} (n=${p.sample_size}).`}
          >
            <Info className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="stat-num text-4xl font-semibold tracking-tight text-ink">
            {p.expected_cutoff.toFixed(2)}
          </span>
          <span className="text-xs text-muted">statistical estimate</span>
        </div>
        <div className="mt-1 text-sm text-muted">
          likely band{" "}
          <span className="stat-num font-medium text-ink">
            {p.band[0].toFixed(2)} – {p.band[1].toFixed(2)}
          </span>
        </div>

        {/* band gauge on the 5–10 CGPA scale */}
        <div className="mt-4">
          <div className="relative h-2 rounded-md bg-line/60">
            <div
              className="absolute inset-y-0 rounded-md bg-ink/15"
              style={{ left: `${pct(p.band[0])}%`, width: `${pct(p.band[1]) - pct(p.band[0])}%` }}
            />
            <div
              className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-accent"
              style={{ left: `${pct(p.expected_cutoff)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between stat-num text-[10px] text-muted">
            <span>{SCALE_MIN}.0</span>
            <span>{SCALE_MAX}.0</span>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Estimate, not official. Based on {p.sample_size} data point{p.sample_size === 1 ? "" : "s"}: {p.basis}
        </p>
      </CardContent>
    </Card>
  );
}
