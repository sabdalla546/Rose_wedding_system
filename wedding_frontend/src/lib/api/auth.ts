import api, { isApiError } from "@/lib/axios";
import type {
  AuthUser,
  LoginPayload,
  LoginResponse,
  MessageResponse,
} from "@/types/auth";

const isUnauthorizedError = (error: unknown) =>
  isApiError(error) && error.status === 401;

export const loginRequest = (payload: LoginPayload) =>
  api.post<LoginResponse>("/auth/login", payload).then((response) => response.data);

export const logoutRequest = () =>
  api.post<MessageResponse>("/auth/logout").then((response) => response.data);

export const refreshSessionRequest = () =>
  api
    .post<LoginResponse>("/auth/refresh-token", {})
    .then((response) => response.data);

export const meRequest = () =>
  api.get<AuthUser>("/auth/me").then((response) => response.data);

export const getCurrentUser = async (attemptRefresh = true) => {
  try {
    return await meRequest();
  } catch (error) {
    if (!attemptRefresh || !isUnauthorizedError(error)) {
      throw error;
    }

    await refreshSessionRequest();
    return meRequest();
  }
};
