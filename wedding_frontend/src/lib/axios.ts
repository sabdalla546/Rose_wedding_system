import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const normalizedBaseUrl = apiBaseUrl.replace(/\/+$/, "");

const resolveBaseUrl = () => {
  if (!normalizedBaseUrl) {
    return "/api/v1";
  }

  return normalizedBaseUrl.endsWith("/api/v1")
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/v1`;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
});

const getPreferredLanguage = (): string => {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = window.localStorage.getItem("i18nextLng");

  if (storedLanguage) {
    return storedLanguage.split("-")[0] || "en";
  }

  const navLang =
    window.navigator.language || window.navigator.languages?.[0] || "en";

  return navLang.split("-")[0] || "en";
};

let refreshPromise: Promise<void> | null = null;

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh-token", {})
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const ensureAxiosHeaders = (config: InternalAxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
    return;
  }

  if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = AxiosHeaders.from(config.headers);
  }
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    ensureAxiosHeaders(config);
    (config.headers as AxiosHeaders).set(
      "Accept-Language",
      getPreferredLanguage()
    );

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || "";

    if (
      originalRequest._retry ||
      url.includes("/auth/login") ||
      url.includes("/auth/refresh-token")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      await refreshAccessToken();
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

type ApiErrorPayload = {
  message?: string;
  errors?: Array<{
    message?: string;
    path?: Array<string | number>;
  }>;
};

export const isApiError = (
  error: unknown
): error is AxiosError<ApiErrorPayload> => axios.isAxiosError(error);

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  if (isApiError(error)) {
    const validationMessage = error.response?.data?.errors
      ?.map((entry) => entry.message?.trim())
      .find(Boolean);

    return (
      error.response?.data?.message ||
      validationMessage ||
      error.message ||
      fallbackMessage
    );
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export default api;
