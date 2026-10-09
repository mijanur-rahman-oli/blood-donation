"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { contactSchema, type ContactInput } from "@/lib/zod-schemas";

/* ----------------------------------------------------------------------
   ContactForm
   ----------------------------------------------------------------------
   Client-side form for /contact. Uses the same `contactSchema` from
   STEP 2 for validation. On submit, fires a Sonner toast (via the
   global `toast` re-exported from `@/app/providers`) and resets the
   form. There is no backend endpoint for contact submissions, so the
   handler short-circuits with a 300 ms simulated delay.
   ---------------------------------------------------------------------- */

interface FieldErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const EMPTY: ContactInput = { name: "", email: "", subject: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmittedSubject, setLastSubmittedSubject] = useState<string | null>(null);

  function validate(next: ContactInput): FieldErrors {
    const result = contactSchema.safeParse(next);
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

  function update<K extends keyof ContactInput>(key: K, value: ContactInput[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    if (errors[key as keyof FieldErrors]) {
      setErrors((prev) => {
        const { [key as keyof FieldErrors]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      setLastSubmittedSubject(values.subject);
      setValues(EMPTY);
      setErrors({});
      // Fire the global toast. The `toast` object is re-exported from
      // `src/app/providers.tsx`; when sonner is installed the call site
      // remains identical.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { toast } = require("@/app/providers") as typeof import("@/app/providers");
      toast.success("Message sent", "We will get back to you within 1 business day.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
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
      </div>
      <div className="mt-4">
        <Field
          label="Subject"
          name="subject"
          placeholder="What is this about?"
          value={values.subject}
          onChange={(v) => update("subject", v)}
          error={errors.subject}
          required
        />
      </div>
      <div className="mt-4">
        <TextareaField
          label="Message"
          name="message"
          placeholder="Share a few sentences of context…"
          value={values.message}
          onChange={(v) => update("message", v)}
          error={errors.message}
          required
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          By submitting you agree to our{" "}
          <a className="text-primary underline-offset-2 hover:underline" href="#">
            privacy policy
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting ? "Sending…" : "Send message"}
        </button>
      </div>

      {lastSubmittedSubject ? (
        <div className="mt-6 rounded-md border border-success/30 bg-success/10 p-4 text-sm text-success">
          <p className="font-semibold">Message received</p>
          <p className="mt-1 text-success/90">
            Subject: <span className="font-medium">{lastSubmittedSubject}</span>
          </p>
        </div>
      ) : null}
    </form>
  );
}

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
  const id = `field-${name}`;
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
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
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

interface TextareaFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  error,
  required,
  placeholder,
}: TextareaFieldProps) {
  const id = `field-${name}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium leading-none text-foreground">
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        placeholder={placeholder}
        rows={6}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
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
