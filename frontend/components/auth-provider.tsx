"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getMe, loginUser, registerUser, updateMe } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import type { ProfileUpdate, User } from "@/lib/types";

/** 0 = network failure; otherwise the HTTP status from the backend. */
export type AuthResult = { ok: boolean; status: number };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, name: string) => Promise<AuthResult>;
  logout: () => void;
  refresh: () => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    const me = await getMe();
    if (me) {
      setUser(me);
    } else {
      // Token rejected or backend unreachable — drop it so the UI is consistent.
      clearToken();
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const res = await loginUser({ email, password });
      if (!res.data) return { ok: false, status: res.status };
      setToken(res.data.access_token);
      await refresh();
      return { ok: true, status: res.status };
    },
    [refresh]
  );

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<AuthResult> => {
      const res = await registerUser({ email, password, name });
      if (!res.data) return { ok: false, status: res.status };
      // Registration returns no token — log in immediately with the same credentials.
      return login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: ProfileUpdate): Promise<boolean> => {
    const updated = await updateMe(patch);
    if (updated) setUser(updated);
    return updated !== null;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, updateProfile }),
    [user, loading, login, register, logout, refresh, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
