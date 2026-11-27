"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { refreshSession, setSessionHint, tokenStorage } from "@/lib/api/api-client";
import { collectEffectiveRoles } from "@/lib/navigation/filter-navigation";
import { encodeRoles } from "@/lib/navigation/route-access";
import { logoutRequest } from "@/lib/api/auth-api";
import type { UserResponse } from "@/types/auth";
import { useProfileQuery } from "./auth-queries";
import { useHasStoredToken } from "./use-token-state";

type AuthContextValue = {
  user: UserResponse | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** One silent refresh per page load: the refresh cookie gives back an access token. */
let bootstrap: Promise<boolean> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const hasToken = useHasStoredToken();
  const [ready, setReady] = useState(false);
  const { data: user, isError } = useProfileQuery();

  useEffect(() => {
    let alive = true;
    bootstrap ??= tokenStorage.get() ? Promise.resolve(true) : refreshSession();
    void bootstrap.finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // Keep the routing hint in step with the roles the signed-in person really has.
  useEffect(() => {
    if (user) setSessionHint(true, encodeRoles(collectEffectiveRoles(user)));
  }, [user]);

  useEffect(() => {
    if (ready && !tokenStorage.get()) setSessionHint(false);
  }, [ready]);

  const logout = useCallback(async () => {
    await logoutRequest();
    tokenStorage.remove();
    queryClient.clear();
  }, [queryClient]);

  const isLoading = useMemo(() => {
    if (!ready) return true;
    if (!hasToken) return false;
    if (isError) return false;
    return user === undefined;
  }, [ready, hasToken, user, isError]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: ready && hasToken && !!user && !isError,
      logout,
    }),
    [ready, hasToken, user, isLoading, isError, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
