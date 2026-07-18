"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { useAuth } from "./auth-provider";

export function AuthMenu() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) {
    return <span className="h-9 w-20 animate-pulse rounded-md bg-line/50" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
      >
        Login
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
      >
        <UserRound className="h-4 w-4 text-muted" />
        <span className="max-w-[10rem] truncate">{user.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-lg border border-line bg-surface py-1">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink hover:bg-line/60"
          >
            <LayoutDashboard className="h-4 w-4 text-muted" /> Dashboard
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink hover:bg-line/60"
          >
            <LogOut className="h-4 w-4 text-muted" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
