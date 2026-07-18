"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Building, Database, GitCompareArrows, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StatsSummary } from "@/lib/types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

export function Hero({ stats }: { stats?: StatsSummary | null }) {
  const reduce = useReducedMotion();

  const chips = [
    stats?.offers_count != null && {
      icon: Database,
      label: `${stats.offers_count.toLocaleString("en-IN")} offers indexed`,
      className: "left-[6%] top-[24%] hidden lg:flex",
      delay: "1.6s",
    },
    stats?.companies_count != null && {
      icon: Building,
      label: `${stats.companies_count.toLocaleString("en-IN")} companies tracked`,
      className: "right-[7%] top-[30%] hidden lg:flex",
      delay: "2.4s",
    },
    stats?.top_recruiters?.[0]?.name && {
      icon: Trophy,
      label: `Top recruiter: ${stats.top_recruiters[0].name}`,
      className: "left-[10%] bottom-[14%] hidden xl:flex",
      delay: "3s",
    },
  ].filter(Boolean) as { icon: typeof Database; label: string; className: string; delay: string }[];

  return (
    <section className="hero-grid relative overflow-hidden">
      {/* Aurora background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <motion.div
          className="absolute left-1/2 top-[-120px] h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20"
          animate={reduce ? undefined : { x: ["-50%", "-46%", "-54%", "-50%"], y: [0, 24, -12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] top-[18%] h-[300px] w-[380px] rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/15"
          animate={reduce ? undefined : { x: [0, -30, 20, 0], y: [0, 18, -16, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[4%] top-[42%] h-[260px] w-[340px] rounded-full bg-fuchsia-500/[0.07] blur-3xl dark:bg-fuchsia-500/10"
          animate={reduce ? undefined : { x: [0, 26, -18, 0], y: [0, -20, 14, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* fade grid into page */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[rgb(var(--background))] to-transparent" />
      </div>

      {/* Floating stat chips */}
      {chips.map((chip) => (
        <motion.span
          key={chip.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          style={reduce ? undefined : { animation: `float-slow 6s ease-in-out ${chip.delay} infinite` }}
          className={`absolute z-10 items-center gap-2 rounded-full border border-zinc-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-zinc-600 shadow-lg shadow-indigo-500/5 backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 ${chip.className}`}
        >
          <chip.icon className="h-3.5 w-3.5 text-indigo-400" />
          {chip.label}
        </motion.span>
      ))}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-20 pt-24 text-center sm:px-6 sm:pt-32"
      >
        <motion.div
          variants={item}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
          Placements · PS-1 · PS-2 · SI — all in one place
        </motion.div>

        <motion.h1
          variants={item}
          className="font-display text-5xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-7xl"
        >
          Place<span className="gradient-text">IQ</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="mt-4 font-display text-2xl font-medium text-zinc-700 dark:text-zinc-200 sm:text-3xl"
        >
          One stop. <span className="gradient-text">Every offer.</span>
        </motion.p>

        <motion.p
          variants={item}
          className="mt-6 max-w-2xl text-balance text-base text-zinc-500 dark:text-zinc-400 sm:text-lg"
        >
          Historical cutoffs, stipends, role trends and interview experiences for BITS Pilani —
          with an expected-CGPA-cutoff predictor for every company. Stop digging through
          year-old spreadsheets.
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/placements">
            <Button variant="glow" size="lg">
              Explore Placements <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/compare">
            <Button variant="outline" size="lg">
              <GitCompareArrows className="h-4 w-4" /> Compare Companies
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
