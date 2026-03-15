export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  isActive: boolean;
  createdAt?: string;
  roles: string[];
  permissions: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}
