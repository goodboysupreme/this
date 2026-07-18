"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { toggleFavorite } from "@/lib/api";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  slug,
  initialFavorited = false,
}: {
  slug: string;
  initialFavorited?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (busy) return;
    // Optimistic toggle — roll back if the backend disagrees or is unreachable.
    const next = !favorited;
    setFavorited(next);
    setBusy(true);
    const confirmed = await toggleFavorite(slug);
    setBusy(false);
    if (confirmed === null) {
      setFavorited(!next);
    } else {
      setFavorited(confirmed);
    }
  }

  return (
    <button
      onClick={onClick}
      aria-pressed={favorited}
      title={user ? (favorited ? "Remove from favorites" : "Save to favorites") : "Sign in to save favorites"}
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all",
        favorited
          ? "border-rose-500/40 bg-rose-500/15 text-rose-500 shadow-lg shadow-rose-500/10"
          : "border-zinc-300 text-zinc-400 hover:border-rose-400/50 hover:text-rose-400 dark:border-white/15"
      )}
    >
      <Heart className={cn("h-5 w-5", favorited && "fill-current")} />
    </button>
  );
}
