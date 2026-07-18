"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
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
        "sticky top-0 z-50 border-b backdrop-blur-xl transition-shadow",
        "border-zinc-200/60 bg-white/70 dark:border-white/5 dark:bg-[#09090f]/70",
        scrolled && "bg-white/85 shadow-lg shadow-zinc-900/[0.04] dark:bg-[#09090f]/85 dark:shadow-black/20"
      )}
    >
      {/* top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 opacity-70" />
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 transition-transform group-hover:scale-105">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
            Place<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">IQ</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-indigo-600 dark:text-indigo-300"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-indigo-500/10"
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-white/10 dark:text-zinc-300"
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
            transition={reduce ? { duration: 0 } : { duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-zinc-200/60 dark:border-white/5 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    pathname.startsWith(l.href)
                      ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                      : "text-zinc-600 dark:text-zinc-400"
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-zinc-200/60 pt-2 dark:border-white/5">
                <AuthMenu />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
