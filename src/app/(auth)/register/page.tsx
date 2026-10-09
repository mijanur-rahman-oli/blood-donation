"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { registerSchema, type RegisterInput } from "@/lib/zod-schemas";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   /register
   ----------------------------------------------------------------------
   Client component. Mirrors the /login layout (brand panel on the
   left, register card on the right). Fields: name, email, password,
   confirmPassword, phone, role (DONOR / REQUESTER). Passwords must
   match (enforced both in the schema's refine and in the field-level
   error below confirmPassword).

   On submit: POST /api/auth/register, populate the auth store with the
   returned user, then router.replace() to the role-specific landing
   page.
   ---------------------------------------------------------------------- */

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  role?: string;
}

const EMPTY: RegisterInput = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "DONOR",
  phone: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [values, setValues] = useState<RegisterInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function update<K extends keyof RegisterInput>(key: K, value: RegisterInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FieldErrors]) {
      setErrors((prev) => {
        const { [key as keyof FieldErrors]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }

  function validate(next: RegisterInput): FieldErrors {
    const result = registerSchema.safeParse(next);
    if (result.success) return {};
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key as keyof FieldErrors]) {
        fieldErrors[key as keyof FieldErrors] = issue.message;
      }
    }
    return fieldErrors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          phone: values.phone,
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { success: true; data: { user: { id: string; name: string; email: string; role: "DONOR" | "REQUESTER" | "ADMIN" } } }
        | { success: false; message: string }
        | null;
      if (!res.ok || !json || json.success !== true) {
        const message =
          json && json.success === false
            ? json.message
            : "Registration failed. Please try again.";
        throw new Error(message);
      }
      setUser(json.data.user as never);
      const target = json.data.user.role === "DONOR" ? "/donor" : "/dashboard";
      router.replace(target);
    } catch (error) {
      setGeneralError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full">
      <div className="grid min-h-screen w-full md:grid-cols-2">
        {/* Brand panel (same as /login) */}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2c-1 4-6 6-6 12a6 6 0 0 0 12 0c0-6-5-8-6-12Z" />
              </svg>
            </span>
            Blood Donation
          </Link>

          <div className="relative space-y-4">
            <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">
              Join the donor network.
            </h2>
            <p className="max-w-sm text-sm text-red-100/90">
              Create your account in under a minute. As a Donor you will see
              compatible requests; as a Requester you can post and track
              verified blood requests.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <TrustBadge label="Email + phone verification" />
              <TrustBadge label="Admin review on every request" />
              <TrustBadge label="Lifetime donation history" />
            </ul>
          </div>

          <p className="relative text-xs text-red-100/70">
            © 2025 Blood Donation Platform. All rights reserved.
          </p>
        </aside>

        {/* Right side */}
        <div className="flex items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign up to start donating or to request blood for a patient.
            </p>

            {generalError ? (
              <div
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>{generalError}</p>
              </div>
            ) : null}

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                placeholder="Your full name"
                value={values.name}
                onChange={(v) => update("name", v)}
                error={errors.name}
                required
              />
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={(v) => update("email", v)}
                error={errors.email}
                required
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={values.password}
                  onChange={(v) => update("password", v)}
                  error={errors.password}
                  required
                />
                <Field
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={values.confirmPassword}
                  onChange={(v) => update("confirmPassword", v)}
                  error={errors.confirmPassword}
                  required
                />
              </div>
              <Field
                label="Phone (BD)"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="01712-345678"
                value={values.phone}
                onChange={(v) => update("phone", v)}
                error={errors.phone}
                required
              />

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium leading-none text-foreground">
                  I am a<span className="ml-0.5 text-destructive" aria-hidden>*</span>
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <RoleCard
                    emoji="🩸"
                    title="Donor"
                    description="I want to donate blood"
                    active={values.role === "DONOR"}
                    onSelect={() => update("role", "DONOR")}
                  />
                  <RoleCard
                    emoji="📋"
                    title="Requester"
                    description="I need blood for a patient"
                    active={values.role === "REQUESTER"}
                    onSelect={() => update("role", "REQUESTER")}
                  />
                </div>
                {errors.role ? (
                  <p role="alert" className="flex items-center gap-1 text-xs font-medium text-destructive">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {errors.role}
                  </p>
                ) : null}
              </fieldset>

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {isSubmitting ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   TrustBadge
   ---------------------------------------------------------------------- */
function TrustBadge({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-red-50/90">{label}</span>
    </li>
  );
}

/* ----------------------------------------------------------------------
   RoleCard (RadioGroup replacement — native <button> with role=radio)
   ---------------------------------------------------------------------- */
interface RoleCardProps {
  emoji: string;
  title: string;
  description: string;
  active: boolean;
  onSelect: () => void;
}

function RoleCard({ emoji, title, description, active, onSelect }: RoleCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex h-auto flex-col items-start gap-1 rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        active
          ? "border-primary bg-primary/5"
          : "border-border",
      )}
    >
      <span aria-hidden className="text-base">
        {emoji}
      </span>
      <span className="text-sm font-semibold text-foreground">{title}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

/* ----------------------------------------------------------------------
   Field
   ---------------------------------------------------------------------- */
interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: FieldProps) {
  const id = `register-${name}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium leading-none text-foreground">
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          error && "border-destructive focus:ring-destructive",
        )}
      />
      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-destructive">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
