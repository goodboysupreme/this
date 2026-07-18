const TOKEN_KEY = "placeiq_token";

// Duplicated from lib/api.ts on purpose: api.ts imports authFetch from this
// module, so importing API_URL back from it would create an import cycle.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * fetch() with the Bearer token attached. Returns null on network error so
 * callers can fall back to a graceful offline state. Never throws.
 */
export async function authFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(`${API_URL}${path}`, { cache: "no-store", ...init, headers });
  } catch {
    return null;
  }
}
