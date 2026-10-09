import { api } from "@/lib/axios";
import type { ApiResponse, User } from "@/types";

import { unwrapData } from "./_errors";

/* ----------------------------------------------------------------------
   Auth
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Auth".
   These hit the backend directly (no /api/auth proxy), so the route
   handlers in /app/api/auth/* are responsible for setting the httpOnly
   cookies. The API modules in this file are the typed wrappers used by
   the auth route handlers and (for refresh) by the axios interceptor.
   ---------------------------------------------------------------------- */

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: "DONOR" | "REQUESTER";
  phone: string;
}

export interface GoogleLoginInput {
  idToken: string;
  role: "DONOR" | "REQUESTER" | "ADMIN";
}

export interface LogoutInput {
  refreshToken: string;
}

export async function login(payload: LoginInput): Promise<AuthResult> {
  const res = await api.post<ApiResponse<AuthResult>>("/auth/login", payload);
  return unwrapData(res);
}

export async function register(payload: RegisterInput): Promise<AuthResult> {
  const res = await api.post<ApiResponse<AuthResult>>("/auth/register", payload);
  return unwrapData(res);
}

export async function googleLogin(
  payload: GoogleLoginInput,
): Promise<AuthResult> {
  const res = await api.post<ApiResponse<AuthResult>>("/auth/google", payload);
  return unwrapData(res);
}

export async function refresh(
  payload: { refreshToken: string },
): Promise<RefreshResult> {
  const res = await api.post<ApiResponse<RefreshResult>>(
    "/auth/refresh-token",
    payload,
  );
  return unwrapData(res);
}

export async function logout(payload: LogoutInput): Promise<null> {
  const res = await api.post<ApiResponse<null>>("/auth/logout", payload);
  return unwrapData(res);
}
