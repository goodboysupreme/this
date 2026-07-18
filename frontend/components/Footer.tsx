import Link from "next/link";

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
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="font-semibold tracking-tight text-ink">
              Place<span className="text-accent">IQ</span>
            </span>
            <p className="mt-3 max-w-sm text-sm text-muted">
              One stop. Every offer. Placement, PS-1, PS-2 and SI intelligence for BITS Pilani.
            </p>
            <p className="mt-4 text-sm text-muted">
              An initiative by <span className="font-medium text-ink">Vansh Malik</span>, BITS Pilani
            </p>
          </div>

          <nav aria-label="Explore">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Explore</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {exploreLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Toolkit">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Toolkit</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {toolkitLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-center text-xs text-muted">
            Cutoff predictions are statistical estimates, not official data. Always verify with
            official placement / PS division announcements.
          </p>
        </div>
      </div>
    </footer>
  );
}
