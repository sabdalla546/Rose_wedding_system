import { useEffect, useState, type ReactNode } from "react";

import { AuthContext, type AuthContextValue } from "@/app/providers/auth-context";
import { isApiError } from "@/lib/axios";
import {
  getCurrentUser,
  loginRequest,
  logoutRequest,
} from "@/lib/api/auth";
import type { AuthStatus, AuthUser, LoginPayload } from "@/types/auth";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const syncSession = async (attemptRefresh: boolean) => {
    const nextUser = await getCurrentUser(attemptRefresh);
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  };

  const refreshUser: AuthContextValue["refreshUser"] = async () => {
    try {
      return await syncSession(true);
    } catch {
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  };

  const signIn: AuthContextValue["signIn"] = async (payload: LoginPayload) => {
    try {
      await loginRequest(payload);
      return await syncSession(false);
    } catch (error) {
      setUser(null);
      setStatus("unauthenticated");
      throw error;
    }
  };

  const signOut: AuthContextValue["signOut"] = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      if (!(isApiError(error) && error.status === 401)) {
        throw error;
      }
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      try {
        const currentUser = await getCurrentUser(true);

        if (!isMounted) {
          return;
        }

        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setStatus("unauthenticated");
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signIn,
    signOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
