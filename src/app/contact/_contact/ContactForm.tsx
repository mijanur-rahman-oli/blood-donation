"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormRegisterReturn } from "react-hook-form";

import { cn } from "@/lib/utils";
import { contactSchema, type ContactInput } from "@/lib/zod-schemas";
import { toast } from "@/app/providers";


export function ContactForm() {
  const [lastSubmittedSubject, setLastSubmittedSubject] = useState<string | null>(null);

  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onChange",
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactInput) {
    await new Promise((r) => setTimeout(r, 300));
    setLastSubmittedSubject(values.subject);
    form.reset({ name: "", email: "", subject: "", message: "" });
    toast.success("Message sent", "We will get back to you within 1 business day.");
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Your name"
          registration={form.register("name")}
          error={form.formState.errors.name?.message}
          required
        />
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
      </div>
      <div className="mt-4">
        <Field
          label="Subject"
          name="subject"
          placeholder="What is this about?"
          registration={form.register("subject")}
          error={form.formState.errors.subject?.message}
          required
        />
      </div>
      <div className="mt-4">
        <TextareaField
          label="Message"
          name="message"
          placeholder="Share a few sentences of context…"
          registration={form.register("message")}
          error={form.formState.errors.message?.message}
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
          disabled={form.formState.isSubmitting}
          className={cn(
            "inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {form.formState.isSubmitting ? "Sending…" : "Send message"}
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
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          error && "border-destructive focus:ring-destructive",
        )}
        {...registration}
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
  registration: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  placeholder?: string;
}

function TextareaField({
  label,
  name,
  registration,
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
        placeholder={placeholder}
        rows={6}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
          error && "border-destructive focus:ring-destructive",
        )}
        {...registration}
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
