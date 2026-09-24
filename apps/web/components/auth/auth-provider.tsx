"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PublicUser } from "@ghardekho/types";
import { getCurrentUser, logout as logoutRequest } from "@/lib/api/auth";

type AuthState = { user: PublicUser | null; loading: boolean; refresh: () => Promise<PublicUser | null>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { const response = await getCurrentUser(); setUser(response.data.user); return response.data.user; }
    catch { setUser(null); return null; }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    const onSessionChange = () => { void refresh(); };
    window.addEventListener("ghardekho:session-changed", onSessionChange);
    return () => { window.clearTimeout(timer); window.removeEventListener("ghardekho:session-changed", onSessionChange); };
  }, [refresh]);
  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    window.dispatchEvent(new Event("ghardekho:session-changed"));
  }, []);
  const value = useMemo(() => ({ user, loading, refresh, signOut }), [user, loading, refresh, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
