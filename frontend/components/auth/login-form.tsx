"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Shared centered card shell for the auth pages. */
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
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>

      <form
        onSubmit={onSubmit}
        className="mt-8 w-full rounded-lg border border-line bg-surface p-6"
      >
        {error && (
          <div className="mb-4 rounded-md border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-4">{children}</div>
        <Button type="submit" className="mt-6 w-full" disabled={busy}>
          {busy ? "Please wait…" : submitLabel}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">{footer}</p>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

export function authErrorMessage(status: number, fallback: string): string {
  if (status === 0) return "Can’t reach the PlaceIQ backend right now. Try again once it’s up.";
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
      setError(authErrorMessage(res.status, "Login failed. Please try again."));
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
          <Link href="/register" className="font-medium text-accent hover:underline">
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
