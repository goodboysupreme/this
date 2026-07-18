"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Building2, FileSearch, Heart, LogIn, Mail, Save } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { getFavorites } from "@/lib/api";
import type { FavoriteCompany } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function DashboardClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200/60 dark:bg-white/5" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-zinc-200/40 dark:bg-white/5" />
          <div className="h-64 animate-pulse rounded-xl bg-zinc-200/40 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <LogIn className="h-7 w-7 text-white" />
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Sign in to view your dashboard
        </h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">
          Your academic profile, favorite companies and shortcuts live here.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login">
            <Button variant="glow">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Create account</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
        Hey, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">{user.email}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <ProfileCard />
        <div className="flex flex-col gap-6">
          <QuickLinks />
          <FavoritesCard />
        </div>
      </div>
    </div>
  );
}

function ProfileCard() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [branch, setBranch] = useState(user?.branch ?? "");
  const [degree, setDegree] = useState(user?.degree ?? "");
  const [gradYear, setGradYear] = useState(user?.grad_year != null ? String(user.grad_year) : "");
  const [cgpa, setCgpa] = useState(user?.cgpa != null ? String(user.cgpa) : "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("saving");
    const ok = await updateProfile({
      name: name.trim() || undefined,
      branch: branch.trim(),
      degree: degree.trim(),
      grad_year: gradYear ? Number(gradYear) : undefined,
      cgpa: cgpa ? Number(cgpa) : undefined,
    });
    setStatus(ok ? "saved" : "error");
    if (ok) setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-300">
              Couldn&apos;t save — the backend may be offline. Try again later.
            </div>
          )}
          {status === "saved" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-600 dark:text-emerald-300">
              Profile saved.
            </div>
          )}
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Branch">
              <Input
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. ECE, CSE, ME"
              />
            </Field>
            <Field label="Degree">
              <Input
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.E., M.Sc."
              />
            </Field>
            <Field label="Graduation year">
              <Input
                type="number"
                min={2000}
                max={2100}
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                placeholder="2027"
              />
            </Field>
            <Field label="CGPA">
              <Input
                type="number"
                step="0.01"
                min={0}
                max={10}
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="8.50"
              />
            </Field>
          </div>
          <Button type="submit" variant="glow" disabled={status === "saving"} className="mt-2 self-start">
            <Save className="h-4 w-4" />
            {status === "saving" ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function QuickLinks() {
  const links = [
    {
      href: "/resume",
      icon: FileSearch,
      title: "Resume Screener",
      description: "ATS scoring and bullet rewrites",
    },
    {
      href: "/outreach",
      icon: Mail,
      title: "Cold Email Centre",
      description: "Templates, contacts and campaigns",
    },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="group">
          <Card className="h-full transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-500/40">
            <CardContent className="flex items-center gap-3 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                <l.icon className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">{l.title}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{l.description}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-indigo-400 transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function FavoritesCard() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteCompany[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getFavorites().then((f) => {
      if (!cancelled) setFavorites(f ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400" /> Favorite companies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites === null ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-zinc-200/40 dark:bg-white/5" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No favorites yet — tap the heart on any{" "}
            <Link href="/placements" className="text-indigo-500 hover:underline dark:text-indigo-300">
              company profile
            </Link>{" "}
            to pin it here.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {favorites.map((c) => (
              <Link key={c.id} href={`/company/${c.slug}`} className="group">
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 transition-colors hover:border-indigo-500/40 dark:border-white/10">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                    <Building2 className="h-4 w-4 text-white" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">{c.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {c.sector && <Badge variant="violet">{c.sector}</Badge>}
                      <span className="text-xs text-zinc-400">{c.offer_count} offers</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
