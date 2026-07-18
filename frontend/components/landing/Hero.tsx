import Link from "next/link";
import { ArrowRight, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatsSummary } from "@/lib/types";

export function Hero({ stats }: { stats?: StatsSummary | null }) {
  const readout: [string, string][] = [];
  if (stats?.offers_count != null)
    readout.push(["offers_indexed", stats.offers_count.toLocaleString("en-IN")]);
  if (stats?.companies_count != null)
    readout.push(["companies_tracked", stats.companies_count.toLocaleString("en-IN")]);
  if (stats?.offers_by_type?.placement != null)
    readout.push(["placement_offers", stats.offers_by_type.placement.toLocaleString("en-IN")]);
  if (stats?.offers_by_type?.ps2 != null)
    readout.push(["ps2_allotments", stats.offers_by_type.ps2.toLocaleString("en-IN")]);
  if (stats?.top_recruiters?.[0]?.name)
    readout.push(["top_recruiter", stats.top_recruiters[0].name]);

  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Placements · PS-1 · PS-2 · SI · BITS Pilani
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-ink text-balance sm:text-5xl">
            One stop. <span className="text-accent">Every offer.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted text-pretty sm:text-lg">
            Historical cutoffs, stipends, role trends and interview experiences for BITS Pilani,
            with an expected-CGPA-cutoff estimate for every company. Stop digging through
            year-old spreadsheets.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/placements">
              <Button size="lg">
                Explore placements <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/compare">
              <Button variant="outline" size="lg">
                <GitCompareArrows className="h-4 w-4" /> Compare companies
              </Button>
            </Link>
          </div>
        </div>

        {readout.length > 0 && (
          <div className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-2.5">
              <span className="font-mono text-xs text-muted">placeiq / live_index</span>
            </div>
            <dl className="divide-y divide-line">
              {readout.map(([key, value]) => (
                <div key={key} className="flex items-baseline justify-between px-4 py-3">
                  <dt className="font-mono text-xs text-muted">{key}</dt>
                  <dd className="stat-num text-sm font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}
