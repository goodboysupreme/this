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
    return <span className="h-9 w-20 animate-pulse rounded-lg bg-zinc-200/60 dark:bg-white/5" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg bg-indigo-500 px-3.5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-colors hover:bg-indigo-400"
      >
        Login
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
      >
        <UserRound className="h-4 w-4 text-indigo-400" />
        <span className="max-w-[10rem] truncate">{user.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-[#12121c]">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            <LayoutDashboard className="h-4 w-4 text-indigo-400" /> Dashboard
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              logout();
              router.push("/");
              router.refresh();
            }}
            className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
          >
            <LogOut className="h-4 w-4 text-zinc-400" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
