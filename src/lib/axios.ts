import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * API base URL.
 *
 * Sourced from `NEXT_PUBLIC_API_URL` (see `.env.local.example`). The variable
 * is inlined at build time by Next.js, so it is safe to read at module scope.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

/* ----------------------------------------------------------------------
   Cookie helpers
   ----------------------------------------------------------------------
   The frontend keeps `accessToken` / `refreshToken` in **httpOnly** cookies
   set by the `/api/auth/*` Next.js route handlers. The browser sends them
   automatically, so client-side `axios` cannot read them. For client-side
   request-attachment (the `Authorization: Bearer` header requested in
   PROJECT.md), we mirror the access token in a non-httpOnly mirror cookie
   named `accessTokenClient` set by the auth route handlers. The mirrors are
   safe to read from JavaScript and are cleared on logout.
   ---------------------------------------------------------------------- */
const CLIENT_ACCESS_COOKIE = "accessTokenClient";
const CLIENT_REFRESH_COOKIE = "refreshTokenClient";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length));
      } catch {
        return part.slice(prefix.length);
      }
    }
  }
  return null;
}

function clearClientAuthCookies(): void {
  if (typeof document === "undefined") return;
  const past = "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/";
  document.cookie = `${CLIENT_ACCESS_COOKIE}=; ${past}`;
  document.cookie = `${CLIENT_REFRESH_COOKIE}=; ${past}`;
}

/* ----------------------------------------------------------------------
   Public + private axios instances
   ---------------------------------------------------------------------- */

/** Used for refresh calls and any endpoint that must not recurse through
 *  the auth interceptor. */
export const publicAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/** Primary client used by every API module. */
export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/* ----------------------------------------------------------------------
   Request interceptor — attach Bearer token
   ---------------------------------------------------------------------- */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = readCookie(CLIENT_ACCESS_COOKIE);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

/* ----------------------------------------------------------------------
   Response interceptor — silent refresh on 401, single retry, then logout
   ---------------------------------------------------------------------- */
type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Coalesce concurrent 401s into a single refresh call.
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = readCookie(CLIENT_REFRESH_COOKIE);
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await publicAxios.post<{
        success: boolean;
        data?: { accessToken: string; refreshToken?: string };
      }>("/auth/refresh-token", { refreshToken });

      const payload = res.data?.data;
      const newAccess = payload?.accessToken;
      const newRefresh = payload?.refreshToken ?? refreshToken;

      if (!newAccess) return null;

      // Mirror new tokens back to client-readable cookies via the auth route.
      // We use the publicAxios here so the response interceptor does not
      // recurse if the proxy itself returns 401.
      try {
        await publicAxios.post("/auth/refresh", {
          accessToken: newAccess,
          refreshToken: newRefresh,
        });
      } catch {
        // Non-fatal: the public mirror is best-effort. The httpOnly cookies
        // are still rotated by the backend.
      }

      return newAccess;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/google") ||
    url.includes("/auth/refresh-token") ||
    url.includes("/auth/logout")
  );
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const requestUrl = original?.url;

    // Only attempt refresh for 401s on non-auth endpoints, and only once.
    if (
      status === 401 &&
      original &&
      !original._retry &&
      !isAuthEndpoint(requestUrl)
    ) {
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        original._retry = true;
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>)["Authorization"] =
          `Bearer ${newAccess}`;
        return api.request(original);
      }

      // Refresh failed — drop the session and bounce to /login.
      clearClientAuthCookies();
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login")
      ) {
        const redirect = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.replace(`/login?redirect=${redirect}`);
      }
    }

    return Promise.reject(error);
  },
);

/* ----------------------------------------------------------------------
   Typed error helper for callers
   ----------------------------------------------------------------------
   Backend error envelope:
     { success: false, message: string, errors?: { path, message }[] }
   ---------------------------------------------------------------------- */
export interface ApiErrorPayload {
  message: string;
  errors?: Array<{ path: string; message: string }>;
}

export function extractApiError(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiErrorPayload> | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function extractApiFieldErrors(
  error: unknown,
): Array<{ path: string; message: string }> {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiErrorPayload> | undefined;
    return data?.errors ?? [];
  }
  return [];
}
