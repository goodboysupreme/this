"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Shared centered glass-card shell for the auth pages. */
export function AuthCard({
  title,
  subtitle,
  error,
  onSubmit,
  busy,
  submitLabel,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  error: string | null;
  onSubmit: (e: FormEvent) => void;
  busy: boolean;
  submitLabel: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 sm:px-6">
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
        <Sparkles className="h-7 w-7 text-white" />
      </span>
      <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        {title}
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:backdrop-blur-sm"
      >
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-4">{children}</div>
        <Button type="submit" variant="glow" className="mt-6 w-full" disabled={busy}>
          {busy ? "Please wait…" : submitLabel}
        </Button>
      </form>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">{footer}</p>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

export function authErrorMessage(status: number, fallback: string): string {
  if (status === 0) return "Can’t reach the PlaceIQ backend right now — try again once it’s up.";
  return fallback;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await login(email.trim(), password);
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else if (res.status === 401) {
      setError("Invalid email or password.");
    } else {
      setError(authErrorMessage(res.status, "Login failed — please try again."));
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to save companies, manage your profile and submit experiences."
      error={error}
      onSubmit={onSubmit}
      busy={busy}
      submitLabel="Sign in"
      footer={
        <>
          New to PlaceIQ?{" "}
          <Link href="/register" className="font-medium text-indigo-500 hover:underline dark:text-indigo-300">
            Create an account
          </Link>
        </>
      }
    >
      <Field label="Email">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="f20230001@pilani.bits-pilani.ac.in"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="Password">
        <Input
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
    </AuthCard>
  );
}
