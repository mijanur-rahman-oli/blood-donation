import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

/* ======================================================================
   Axios — browser-side HTTP clients
   ----------------------------------------------------------------------
   Two instances are exported:

   - `api`            — the primary client used by every API module
                        in the browser. baseURL is RELATIVE (empty
                        string) so every call resolves against the
                        current origin (http://localhost:3000 in dev,
                        the Vercel URL in production). The browser
                        never talks to the upstream backend directly,
                        so CORS is never in play — every request is
                        handled by a Next.js route handler under
                        /api/* which forwards to the backend using
                        the httpOnly access-token cookie.

   - `publicAxios`    — kept for SERVER-SIDE use (e.g. /api/auth/login
                        and friends, which are invoked from Route
                        Handlers running on Node and need an absolute
                        backend URL). It still talks to the backend
                        directly. The browser never imports it.

   The 401-refresh interceptor on `api` no longer calls
   publicAxios.post("/auth/refresh-token", ...) directly — that would
   hit the backend from the browser and CORS would block it. It now
   calls the same-origin /api/auth/refresh route handler, which
   forwards to the backend and returns the rotated tokens.

   `withCredentials: true` is set on `api` so the httpOnly cookies
   are included in the same-origin XHR.
   ====================================================================== */

/* ----------------------------------------------------------------------
   Cookie helpers
   ----------------------------------------------------------------------
   The frontend keeps `accessToken` / `refreshToken` in **httpOnly**
   cookies set by the /api/auth/* Next.js route handlers. The browser
   sends them automatically, so client-side `axios` cannot read them.
   For client-side request-attachment (the `Authorization: Bearer`
   header requested in PROJECT.md), we mirror the access token in a
   non-httpOnly mirror cookie named `accessTokenClient` set by the
   auth route handlers. The mirrors are safe to read from JavaScript
   and are cleared on logout.
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

/** Upstream backend base URL. Used by the SERVER-SIDE `publicAxios`
 *  and by the /api/auth/* and /api/donors/* proxy helpers — never by
 *  browser code. */
export const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://blood-donation-server-weld-psi.vercel.app/api/v1";

/** Server-side only. Imported by /api/auth/* route handlers. */
export const publicAxios = axios.create({
  baseURL: BACKEND_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

/** Primary client used by every API module in the browser.
 *  Empty baseURL → every request resolves against the current origin
 *  (Next.js), which forwards to the backend via the /api/* proxies. */
export const api = axios.create({
  baseURL: "",
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/* ----------------------------------------------------------------------
   Request interceptor — attach Bearer token
   ----------------------------------------------------------------------
   The token is read from the client-readable mirror cookie set by the
   /api/auth/* route handlers. The route handlers themselves read the
   httpOnly `accessToken` cookie to authenticate against the backend.
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
   ----------------------------------------------------------------------
   The refresh flow goes through the same-origin /api/auth/refresh
   route handler. We do NOT call the upstream backend directly here —
   that would CORS-block the browser.
   ---------------------------------------------------------------------- */
type RetryConfig = AxiosRequestConfig & { _retry?: boolean };

interface RefreshResponse {
  success: boolean;
  message?: string;
  data?: { accessToken?: string; refreshToken?: string };
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = readCookie(CLIENT_REFRESH_COOKIE);
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      // Hit the same-origin proxy. The /api/auth/refresh route handler
      // forwards to the upstream /auth/refresh-token and sets the
      // rotated httpOnly cookies + the client-mirror cookies.
      const res = await api.post<RefreshResponse>("/api/auth/refresh", {
        refreshToken,
      });

      const newAccess = res.data?.data?.accessToken ?? null;
      const newRefresh = res.data?.data?.refreshToken ?? refreshToken;

      if (!newAccess) return null;

      // Keep the client-readable mirrors in sync with the httpOnly
      // cookies the route handler just set. This is the same
      // observation the response interceptor uses on subsequent calls.
      try {
        document.cookie = `${CLIENT_ACCESS_COOKIE}=${encodeURIComponent(
          newAccess,
        )}; Path=/; SameSite=Lax; Max-Age=900`;
        document.cookie = `${CLIENT_REFRESH_COOKIE}=${encodeURIComponent(
          newRefresh,
        )}; Path=/; SameSite=Lax; Max-Age=2592000`;
      } catch {
        // Non-fatal: the mirrors are best-effort; the httpOnly
        // cookies are still authoritative.
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
    url.includes("/auth/logout") ||
    url.includes("/api/auth/")
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

export function extractApiError(
  error: unknown,
  fallback = "Something went wrong",
): string {
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
