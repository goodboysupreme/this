"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { AuthMenu } from "./auth-menu";
import { cn } from "@/lib/utils";

const links = [
  { href: "/placements", label: "Placements" },
  { href: "/ps1", label: "PS-1" },
  { href: "/ps2", label: "PS-2" },
  { href: "/si", label: "SI" },
  { href: "/compare", label: "Compare" },
  { href: "/resume", label: "Resume" },
  { href: "/outreach", label: "Outreach" },
  { href: "/experiences", label: "Experiences" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur-md transition-shadow",
        scrolled && "shadow-sm shadow-ink/5"
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1 font-semibold tracking-tight text-ink">
          Place<span className="text-accent">IQ</span>
          <span className="hidden font-mono text-[10px] font-normal uppercase tracking-widest text-muted sm:inline">
            BITS Pilani
          </span>
        </Link>

        <div className="hidden items-center gap-0.5 md:flex">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-md px-3 py-2 text-sm transition-colors",
                  active ? "font-medium text-ink" : "text-muted hover:text-ink"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                    className="absolute inset-0 rounded-md bg-surface ring-1 ring-line"
                  />
                )}
                <span className="relative">{l.label}</span>
              </Link>
            );
          })}
          <div className="ml-2 flex items-center gap-1">
            <AuthMenu />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <div className="flex flex-col gap-0.5 px-4 py-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm",
                    pathname.startsWith(l.href)
                      ? "bg-surface font-medium text-ink"
                      : "text-muted"
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-line pt-2">
                <AuthMenu />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
