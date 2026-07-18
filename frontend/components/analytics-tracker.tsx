"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { postAnalyticsEvent } from "@/lib/api";

/**
 * Pings the backend with the current path on every route change.
 * Fire-and-forget, dedupes consecutive identical paths, renders nothing
 * and must never throw.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    void postAnalyticsEvent(pathname).catch(() => {
      /* never break the UI for analytics */
    });
  }, [pathname]);

  return null;
}
