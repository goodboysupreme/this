import Link from "next/link";
import { Sparkles } from "lucide-react";

const exploreLinks = [
  { href: "/placements", label: "Placements" },
  { href: "/ps1", label: "PS-1" },
  { href: "/ps2", label: "PS-2" },
  { href: "/si", label: "Summer Internships" },
  { href: "/compare", label: "Compare Companies" },
  { href: "/dashboard", label: "Stats Dashboard" },
];

const toolkitLinks = [
  { href: "/resume", label: "Resume Screener" },
  { href: "/resume/jd-match", label: "JD Match" },
  { href: "/outreach", label: "Cold Email Centre" },
  { href: "/experiences", label: "Experience Bank" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/60 dark:border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="font-bold text-zinc-900 dark:text-white">
                Place<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">IQ</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              One stop. Every offer. Placement, PS-1, PS-2 and SI intelligence for BITS Pilani.
            </p>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
              An initiative by{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">Vansh Malik</span> —
              BITS Pilani
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-zinc-500 hover:text-indigo-500 dark:text-zinc-400 dark:hover:text-indigo-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Toolkit">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Toolkit
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {toolkitLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-zinc-500 hover:text-indigo-500 dark:text-zinc-400 dark:hover:text-indigo-300"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-zinc-200/60 pt-6 dark:border-white/5">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            Cutoff predictions are statistical estimates, not official data. Always verify with
            official placement / PS division announcements.
          </p>
        </div>
      </div>
    </footer>
  );
}
