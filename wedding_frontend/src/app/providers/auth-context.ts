import { createContext } from "react";

import type { AuthStatus, AuthUser, LoginPayload } from "@/types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);
