import { publicAxios } from "@/lib/axios";
import type { ApiResponse, User } from "@/types";

import { unwrapData } from "./_errors";

/* ----------------------------------------------------------------------
   Auth
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Auth".
   These talk to the upstream backend directly and are intended to be
   imported from SERVER-SIDE code only (the /api/auth/* route
   handlers). They use `publicAxios`, which has an absolute
   `BACKEND_BASE_URL` and is safe from the Node runtime. Do NOT call
   these from client components — the browser would CORS-block the
   request.
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
  const res = await publicAxios.post<ApiResponse<AuthResult>>(
    "/auth/login",
    payload,
  );
  return unwrapData(res);
}

export async function register(payload: RegisterInput): Promise<AuthResult> {
  const res = await publicAxios.post<ApiResponse<AuthResult>>(
    "/auth/register",
    payload,
  );
  return unwrapData(res);
}

export async function googleLogin(
  payload: GoogleLoginInput,
): Promise<AuthResult> {
  const res = await publicAxios.post<ApiResponse<AuthResult>>(
    "/auth/google",
    payload,
  );
  return unwrapData(res);
}

export async function refresh(
  payload: { refreshToken: string },
): Promise<RefreshResult> {
  const res = await publicAxios.post<ApiResponse<RefreshResult>>(
    "/auth/refresh-token",
    payload,
  );
  return unwrapData(res);
}

export async function logout(payload: LogoutInput): Promise<null> {
  const res = await publicAxios.post<ApiResponse<null>>(
    "/auth/logout",
    payload,
  );
  return unwrapData(res);
}
