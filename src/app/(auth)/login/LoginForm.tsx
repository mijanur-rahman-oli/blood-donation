"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormRegisterReturn } from "react-hook-form";

import {
  DEMO_ACCOUNTS,
  type DemoAccount,
  type Role,
} from "@/lib/constants";
import { loginSchema, type LoginInput } from "@/lib/zod-schemas";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   LoginForm
   ----------------------------------------------------------------------
   RHF + Zod form. Two-column layout on desktop, single column on mobile.
   Demo accounts and Google Sign-In sit below the form.
   ---------------------------------------------------------------------- */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon" | "sign-in-with";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              width?: number;
              locale?: string;
            },
          ) => void;
        };
      };
    };
  }
}

const EMPTY: LoginInput = { email: "", password: "" } as LoginInput;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") ?? "";
  const expiredFlag = searchParams.get("expired") === "1";

  const setUser = useAuthStore((s) => s.setSessionUser);
  const [loadingRole, setLoadingRole] = useState<Role | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [expiredShown, setExpiredShown] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: { email: "", password: "" } as LoginInput,
  });

  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    if (expiredFlag && !expiredShown) {
      setGeneralError("Your session expired. Please sign in again.");
      setExpiredShown(true);
    }
  }, [expiredFlag, expiredShown]);

  async function performLogin(payload: {
    email: string;
    password: string;
  }): Promise<{
    user: { id: string; name: string; email: string; role: Role };
  }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as
      | {
          success: true;
          data: {
            user: { id: string; name: string; email: string; role: Role };
          };
        }
      | { success: false; message: string }
      | null;
    if (!res.ok || !json || json.success !== true) {
      const message =
        json && json.success === false
          ? json.message
          : "Login failed. Please check your credentials and try again.";
      throw new Error(message);
    }
    return json.data;
  }

  function resolveRedirectPath(role: Role): string {
    if (redirectParam && redirectParam.startsWith("/")) {
      return redirectParam;
    }
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "DONOR":
        return "/donor";
      case "REQUESTER":
      default:
        return "/dashboard";
    }
  }

  async function onSubmit(values: LoginInput) {
    setGeneralError(null);
    try {
      const data = await performLogin({
        email: values.email,
        password: values.password,
      });
      setUser(data.user);
      router.replace(resolveRedirectPath(data.user.role));
    } catch (error) {
      setGeneralError((error as Error).message);
    }
  }

  async function loginAsDemo(account: DemoAccount) {
    if (isSubmitting || loadingRole) return;
    setLoadingRole(account.role);
    setGeneralError(null);
    try {
      const data = await performLogin({
        email: account.email,
        password: account.password,
      });
      setUser(data.user);
      router.replace(resolveRedirectPath(data.user.role));
    } catch (error) {
      setGeneralError((error as Error).message);
    } finally {
      setLoadingRole(null);
    }
  }

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const SCRIPT_ID = "google-identity-services";
    const parentId = "google-signin-button";

    function render() {
      const parent = document.getElementById(parentId);
      if (!parent || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        callback: async (response) => {
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                idToken: response.credential,
                role: "REQUESTER",
              }),
            });
            const json = (await res.json().catch(() => null)) as
              | {
                  success: true;
                  data: {
                    user: { id: string; name: string; email: string; role: Role };
                  };
                }
              | { success: false; message: string }
              | null;
            if (!res.ok || !json || json.success !== true) {
              const message =
                json && json.success === false
                  ? json.message
                  : "Google sign-in failed";
              setGeneralError(message);
              return;
            }
            setUser(json.data.user);
            router.replace(resolveRedirectPath(json.data.user.role));
          } catch (error) {
            setGeneralError((error as Error).message);
          }
        },
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(parent, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 320,
      });
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adminDemo = useMemo(
    () => DEMO_ACCOUNTS.find((a) => a.role === "ADMIN"),
    [],
  );
  const donorDemo = useMemo(
    () => DEMO_ACCOUNTS.find((a) => a.role === "DONOR"),
    [],
  );
  const requesterDemo = useMemo(
    () => DEMO_ACCOUNTS.find((a) => a.role === "REQUESTER"),
    [],
  );

  return (
    <div className="min-h-screen w-full">
      <div className="grid min-h-screen w-full md:grid-cols-2">
        <BrandPanel />

        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Welcome Back <span aria-hidden>👋</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Login to your account
            </p>

            {generalError ? (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="mt-0.5 shrink-0"
                >
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p>{generalError}</p>
              </div>
            ) : null}

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="mt-6 space-y-4"
            >
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                registration={form.register("email")}
                error={form.formState.errors.email?.message}
                required
              />
              <Field
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                registration={form.register("password")}
                error={form.formState.errors.password?.message}
                required
              />

              <button
                type="submit"
                disabled={isSubmitting || loadingRole !== null}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                <span aria-hidden>🔐</span>
                {isSubmitting ? "Signing in…" : "Login"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" aria-hidden />
              <span>─── OR ───</span>
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>

            <h2 className="text-base font-semibold text-foreground">
              <span aria-hidden>🚀</span> Quick Demo Login
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              One click to explore each role. Credentials are pre-filled.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {adminDemo ? (
                <DemoButton
                  account={adminDemo}
                  emoji="👨‍💼"
                  roleLabel="Admin"
                  loading={loadingRole === "ADMIN"}
                  disabled={isSubmitting || loadingRole !== null}
                  onClick={loginAsDemo}
                />
              ) : null}
              {donorDemo ? (
                <DemoButton
                  account={donorDemo}
                  emoji="🩸"
                  roleLabel="Donor"
                  loading={loadingRole === "DONOR"}
                  disabled={isSubmitting || loadingRole !== null}
                  onClick={loginAsDemo}
                />
              ) : null}
            </div>
            <div className="mt-3">
              {requesterDemo ? (
                <DemoButton
                  account={requesterDemo}
                  emoji="📋"
                  roleLabel="Requester"
                  loading={loadingRole === "REQUESTER"}
                  disabled={isSubmitting || loadingRole !== null}
                  onClick={loginAsDemo}
                  fullWidth
                />
              ) : null}
            </div>

            <div className="mt-6 flex justify-center">
              <div
                id="google-signin-button"
                className="flex h-11 w-full max-w-[320px] items-center justify-center rounded-md border border-border bg-background"
              >
                {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                  <span className="text-xs text-muted-foreground">
                    Google Sign-In (set NEXT_PUBLIC_GOOGLE_CLIENT_ID)
                  </span>
                ) : null}
              </div>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Brand panel
   ---------------------------------------------------------------------- */
function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-red-600 to-red-800 p-10 text-red-50 md:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_60%)]"
      />
      <Link
        href="/"
        className="relative inline-flex items-center gap-2 text-lg font-semibold text-white"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15 text-white"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
          </svg>
        </span>
        Blood Donation
      </Link>

      <div className="relative space-y-4">
        <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
          Connecting Donors.
          <br />
          Saving Lives.
        </h2>
        <p className="max-w-sm text-sm text-red-100/90">
          A verified platform that matches compatible, available, medically-
          eligible donors to patients in minutes — across all 64 districts
          of Bangladesh.
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          <TrustBadge label="JWT-secured sessions" />
          <TrustBadge label="Admin-verified every request" />
          <TrustBadge label="64 districts · 24/7" />
        </ul>
      </div>

      <p className="relative text-xs text-red-100/70">
        © 2025 Blood Donation Platform. All rights reserved.
      </p>
    </aside>
  );
}

function TrustBadge({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-red-50/90">{label}</span>
    </li>
  );
}

interface DemoButtonProps {
  account: DemoAccount;
  emoji: string;
  roleLabel: string;
  loading: boolean;
  disabled: boolean;
  fullWidth?: boolean;
  onClick: (account: DemoAccount) => void;
}

function DemoButton({
  account,
  emoji,
  roleLabel,
  loading,
  disabled,
  fullWidth,
  onClick,
}: DemoButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(account)}
      disabled={disabled}
      className={cn(
        "group inline-flex h-14 items-center gap-3 rounded-md border border-border bg-background px-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        fullWidth ? "w-full" : "w-full",
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-base"
      >
        {emoji}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-semibold text-foreground">
          {roleLabel} Demo
        </span>
        <span className="truncate text-[11px] text-muted-foreground">
          {account.email}
        </span>
      </span>
      {loading ? (
        <span
          aria-hidden
          className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
        />
      ) : (
        <span
          aria-hidden
          className="ml-2 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        >
          →
        </span>
      )}
    </button>
  );
}

interface FieldProps {
  label: string;
  name: string;
  registration: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  label,
  name,
  registration,
  error,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: FieldProps) {
  const id = `login-${name}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        ) : null}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          error && "border-destructive focus:ring-destructive",
        )}
        {...registration}
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1 text-xs font-medium text-destructive"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}
