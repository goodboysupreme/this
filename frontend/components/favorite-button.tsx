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
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
        favorited
          ? "border-danger/40 bg-danger-soft text-danger"
          : "border-line text-muted hover:border-danger/40 hover:text-danger"
      )}
    >
      <Heart className={cn("h-5 w-5", favorited && "fill-current")} />
    </button>
  );
}
