"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { Input } from "@/components/ui/input";
import { AuthCard, Field, authErrorMessage } from "./login-form";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await register(email.trim(), password, name.trim());
    setBusy(false);
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else if (res.status === 409) {
      setError("An account with this email already exists. Try signing in instead.");
    } else {
      setError(authErrorMessage(res.status, "Registration failed. Please try again."));
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="One account for favorites, your academic profile and the experience bank."
      error={error}
      onSubmit={onSubmit}
      busy={busy}
      submitLabel="Create account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Field label="Name">
        <Input
          type="text"
          required
          autoComplete="name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
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
          minLength={6}
          autoComplete="new-password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
    </AuthCard>
  );
}
