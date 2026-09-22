"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth as authApi, setToken, getToken } from "@/lib/api";

const AuthContext = createContext(null);

const PUBLIC_ROUTES = ["/login"];

/**
 * Development escape hatch. With NEXT_PUBLIC_AUTH_DISABLED=true the app skips
 * the PIN screen entirely and runs as a local admin, so the interface can be
 * built and reviewed before the backend exists.
 *
 * Turn this off before the shop uses it. A till with no sign-in records no
 * attendance and attributes every sale to nobody.
 */
const AUTH_DISABLED = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

const DEV_USER = {
  id: "dev",
  fullName: "Developer",
  roles: ["admin"],
  schedule: { startTime: "11:00", endTime: "19:00" },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(AUTH_DISABLED ? DEV_USER : null);
  const [checking, setChecking] = useState(!AUTH_DISABLED);
  const router = useRouter();
  const pathname = usePathname();

  // Restore the session on load. A till that logs itself out every refresh
  // would have the staff re-entering PINs all day.
  useEffect(() => {
    if (AUTH_DISABLED) return;
    let cancelled = false;
    async function restore() {
      if (!getToken()) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (checking || AUTH_DISABLED) return;
    const isPublic = PUBLIC_ROUTES.includes(pathname);
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace("/");
  }, [user, checking, pathname, router]);

  const signIn = useCallback(async (pin) => {
    const result = await authApi.signIn(pin);
    setToken(result.token);
    setUser(result.user);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    if (AUTH_DISABLED) return;
    try {
      await authApi.signOut();
    } catch {
      // Clocking out server-side is best-effort; the session ends either way.
    }
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      checking,
      signIn,
      signOut,
      can: (role) => Boolean(user?.roles?.includes(role) || user?.roles?.includes("admin")),
      isAdmin: Boolean(user?.roles?.includes("admin")),
    }),
    [user, checking, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function initials(fullName) {
  if (!fullName) return "··";
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
