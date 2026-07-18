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
        <div className="h-8 w-48 animate-pulse rounded bg-line/50" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-line/50" />
          <div className="h-64 animate-pulse rounded-lg bg-line/50" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:px-6">
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-surface text-muted">
          <LogIn className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Sign in to view your dashboard
        </h1>
        <p className="mt-3 text-muted">
          Your academic profile, favorite companies and shortcuts live here.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/login">
            <Button>Login</Button>
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
      <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        Hey, {user.name.split(" ")[0]}
      </h1>
      <p className="mt-2 text-muted">{user.email}</p>

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
            <div className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
              Couldn&apos;t save: the backend may be offline. Try again later.
            </div>
          )}
          {status === "saved" && (
            <div className="rounded-md border border-success/30 bg-success-soft px-3 py-2.5 text-sm text-success">
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
          <Button type="submit" disabled={status === "saving"} className="mt-2 self-start">
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
      <span className="text-sm font-medium text-ink">{label}</span>
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
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="divide-y divide-line">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-surface"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
              <l.icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{l.title}</span>
              <span className="mt-0.5 block truncate text-xs text-muted">{l.description}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
          </Link>
        ))}
      </div>
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
          <Heart className="h-4 w-4 text-muted" /> Favorite companies
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-line/50" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-sm text-muted">
            No favorites yet. Tap the heart on any{" "}
            <Link href="/placements" className="text-accent hover:underline">
              company profile
            </Link>{" "}
            to pin it here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <div className="divide-y divide-line">
              {favorites.map((c) => (
                <Link
                  key={c.id}
                  href={`/company/${c.slug}`}
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface"
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                    <span className="mt-0.5 flex items-center gap-2">
                      {c.sector && <Badge variant="secondary">{c.sector}</Badge>}
                      <span className="text-xs text-muted">
                        <span className="stat-num">{c.offer_count}</span> offers
                      </span>
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
