import Link from "next/link";
import {
  Briefcase,
  FlaskConical,
  Building2,
  Sun,
  FileSearch,
  Target,
  Mail,
  Building,
  Database,
  TrendingUp,
  ArrowRight,
  Compass,
  Gauge,
  Rocket,
} from "lucide-react";
import { getStatsSummary } from "@/lib/api";
import { Hero } from "@/components/landing/Hero";
import { CountUp } from "@/components/landing/CountUp";
import { FadeIn } from "@/components/FadeIn";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    key: "placement",
    href: "/placements",
    icon: Briefcase,
    title: "Placements Hub",
    description: "CTCs, role categories and CGPA cutoffs for every campus placement season.",
    accent: "from-indigo-500 to-blue-500",
  },
  {
    key: "ps1",
    href: "/ps1",
    icon: FlaskConical,
    title: "PS-1",
    description: "First Practice School stations, stipends and branch-wise allocation history.",
    accent: "from-violet-500 to-purple-500",
  },
  {
    key: "ps2",
    href: "/ps2",
    icon: Building2,
    title: "PS-2",
    description: "Final-semester PS stations, PPO trends and what each station actually expects.",
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    key: "si",
    href: "/si",
    icon: Sun,
    title: "Summer Internships",
    description: "SI offers, monthly stipends and shortlist cutoffs across years.",
    accent: "from-cyan-500 to-sky-500",
  },
];

const features = [
  {
    href: "/resume",
    icon: FileSearch,
    title: "Resume Screener",
    description: "AI-powered ATS scoring with an offline fallback engine — section-wise feedback and bullet rewrites.",
  },
  {
    href: "/resume/jd-match",
    icon: Target,
    title: "JD Match",
    description: "Paste a job description, get a match score, tailored bullets and project ideas to close the gap.",
  },
  {
    href: "/outreach",
    icon: Mail,
    title: "Cold Email Centre",
    description: "Templates, contact lists and safe batch sending with dry-run mode for referrals and alumni outreach.",
  },
];

const steps = [
  {
    icon: Compass,
    title: "Explore the data",
    description:
      "Browse every placement, PS and SI offer on record — filter by year, branch, role and CGPA cutoff.",
  },
  {
    icon: Gauge,
    title: "Predict your cutoffs",
    description:
      "Each company page shows an expected CGPA cutoff with a confidence band and transparent methodology.",
  },
  {
    icon: Rocket,
    title: "Prepare & apply",
    description:
      "Screen your resume, match it to a JD, and run referral outreach — all without leaving PlaceIQ.",
  },
];

export default async function HomePage() {
  const stats = await getStatsSummary();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "PlaceIQ",
        description:
          "Placement, PS-1, PS-2 and SI intelligence for BITS Pilani — cutoffs, stats, predictors and experiences. An initiative by Vansh Malik, BITS Pilani.",
        founder: {
          "@type": "Person",
          name: "Vansh Malik",
          affiliation: { "@type": "CollegeOrUniversity", name: "BITS Pilani" },
        },
      },
      {
        "@type": "WebSite",
        name: "PlaceIQ — BITS Pilani Placement & PS Intelligence",
        alternateName: "PlaceIQ",
        description:
          "One stop. Every offer. An initiative by Vansh Malik, BITS Pilani.",
      },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero stats={stats} />

      {/* Live stats strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <FadeIn>
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
            <CardContent className="grid grid-cols-2 gap-6 py-8 sm:grid-cols-4">
              <Stat icon={Building} label="Companies tracked" value={stats?.companies_count} />
              <Stat icon={Database} label="Offers indexed" value={stats?.offers_count} />
              <Stat
                icon={Briefcase}
                label="Placement offers"
                value={stats?.offers_by_type?.placement}
              />
              <Stat
                icon={TrendingUp}
                label="Top recruiter"
                text={stats?.top_recruiters?.[0]?.name}
              />
            </CardContent>
          </Card>
          {!stats && (
            <p className="mt-3 text-center text-xs text-amber-500/80">
              Live stats unavailable — backend offline. Everything else still works once it&apos;s up.
            </p>
          )}
        </FadeIn>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <FadeIn>
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Four pillars. <span className="gradient-text">One intelligence hub.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-500 dark:text-zinc-400">
            Every dataset BITS students care about — explorable, filterable, and backed by cutoff
            predictions with transparent methodology.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p, i) => (
            <FadeIn key={p.key} delay={i * 0.08}>
              <Link href={p.href} className="group block h-full">
                <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10">
                  <CardContent className="flex h-full flex-col gap-4 py-6">
                    <span
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${p.accent} shadow-lg`}
                    >
                      <p.icon className="h-5 w-5 text-white" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{p.title}</h3>
                      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{p.description}</p>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 dark:text-indigo-300">
                      {stats?.offers_by_type?.[p.key] != null && (
                        <Badge variant="indigo">{stats.offers_by_type[p.key]} offers</Badge>
                      )}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-zinc-200/60 bg-zinc-50/50 dark:border-white/5 dark:bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <FadeIn>
            <h2 className="text-center font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              From data to offer, in three steps
            </h2>
          </FadeIn>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.1}>
                <div className="relative flex h-full flex-col gap-3 rounded-xl p-1">
                  <span className="font-display text-sm font-semibold tracking-widest text-indigo-400/70">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                    <s.icon className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                  </span>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{s.title}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{s.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Live features */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <FadeIn>
          <h2 className="text-center font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
            Beyond the data
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-500 dark:text-zinc-400">
            PlaceIQ is a full placement-prep toolkit — screen your resume, match it to a JD, and
            run outreach, all in one place.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.08}>
              <Link href={f.href} className="group block h-full">
                <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10">
                  <CardContent className="flex h-full flex-col gap-4 py-6">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                        <f.icon className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                      </span>
                      <Badge variant="success">Live</Badge>
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">{f.title}</h3>
                      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{f.description}</p>
                    </div>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-indigo-500 dark:text-indigo-300">
                      Open
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  text,
}: {
  icon: typeof Building;
  label: string;
  value?: number;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <Icon className="h-5 w-5 text-indigo-400" />
      <span className="font-display text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl">
        {text ?? (value != null ? <CountUp value={value} /> : "—")}
      </span>
      <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</span>
    </div>
  );
}
