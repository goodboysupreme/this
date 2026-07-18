import Link from "next/link";
import {
  Briefcase,
  FlaskConical,
  Building2,
  Sun,
  FileSearch,
  Target,
  Mail,
  ArrowRight,
} from "lucide-react";
import { getStatsSummary } from "@/lib/api";
import { Hero } from "@/components/landing/Hero";
import { FadeIn } from "@/components/FadeIn";
import { Badge } from "@/components/ui/badge";

const pillars = [
  {
    key: "placement",
    href: "/placements",
    icon: Briefcase,
    title: "Placements Hub",
    description: "CTCs, role categories and CGPA cutoffs for every campus placement season.",
  },
  {
    key: "ps1",
    href: "/ps1",
    icon: FlaskConical,
    title: "PS-1",
    description: "First Practice School stations, stipends and branch-wise allocation history.",
  },
  {
    key: "ps2",
    href: "/ps2",
    icon: Building2,
    title: "PS-2",
    description: "Final-semester PS stations, PPO trends and what each station actually expects.",
  },
  {
    key: "si",
    href: "/si",
    icon: Sun,
    title: "Summer Internships",
    description: "SI offers, monthly stipends and shortlist cutoffs across years.",
  },
];

const features = [
  {
    href: "/resume",
    icon: FileSearch,
    title: "Resume Screener",
    description: "ATS scoring with section-wise feedback and bullet rewrites. AI engine with offline fallback.",
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
    title: "Explore the data",
    description:
      "Browse every placement, PS and SI offer on record, filtered by year, branch, role and CGPA cutoff.",
  },
  {
    title: "Predict your cutoffs",
    description:
      "Each company page shows an expected CGPA cutoff with a confidence band and transparent methodology.",
  },
  {
    title: "Prepare & apply",
    description:
      "Screen your resume, match it to a JD, and run referral outreach, all without leaving PlaceIQ.",
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

      {/* Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <FadeIn>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Four datasets. One hub.
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Every dataset BITS students care about: explorable, filterable, and backed by cutoff
            estimates with transparent methodology.
          </p>
        </FadeIn>

        <FadeIn className="mt-8 overflow-hidden rounded-lg border border-line">
          <div className="divide-y divide-line">
            {pillars.map((p) => (
              <Link
                key={p.key}
                href={p.href}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-surface sm:grid-cols-[auto_1fr_auto_auto] sm:px-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                  <p.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-medium text-ink">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-muted">{p.description}</span>
                </span>
                {stats?.offers_by_type?.[p.key] != null && (
                  <span className="stat-num hidden text-sm font-medium text-muted sm:block">
                    {stats.offers_by_type[p.key].toLocaleString("en-IN")} offers
                  </span>
                )}
                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* How it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <FadeIn>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              From data to offer, in three steps
            </h2>
          </FadeIn>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <FadeIn key={s.title} delay={i * 0.08}>
                <div className="flex h-full flex-col gap-3">
                  <span className="stat-num text-sm font-semibold text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-semibold text-ink">{s.title}</h3>
                  <p className="text-sm text-muted">{s.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Toolkit */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <FadeIn>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Beyond the data
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Screen your resume, match it to a JD, and run outreach, all in one place.
          </p>
        </FadeIn>

        <FadeIn className="mt-8 overflow-hidden rounded-lg border border-line">
          <div className="divide-y divide-line">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-surface sm:px-6"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                  <f.icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="flex items-center gap-2 font-medium text-ink">
                    {f.title}
                    <Badge variant="success">Live</Badge>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{f.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
