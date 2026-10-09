"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from "react";

import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------------
   FormField
   ----------------------------------------------------------------------
   A small, dependency-free wrapper that pairs a label, optional
   description, control slot, and error message. Designed to slot in
   under a React Hook Form `Controller` (or as a plain controlled
   input) without requiring the shadcn `<Form>` primitive.

   Three convenience components are exported for the common controls:
     - <FormField />              (renders the wrapper + a slot for the control)
     - <FormInput />              (text/email/etc. input)
     - <FormTextarea />           (multi-line)
     - <FormSelect />             (native <select>)

   The control is passed in via `children` (FormField) or as a typed
   `...props` (FormInput / FormTextarea / FormSelect), so this works
   with any third-party input or a custom shadcn primitive when one
   is installed.
   ---------------------------------------------------------------------- */

export interface FormFieldBaseProps {
  label: string;
  /** Help text shown beneath the label. */
  description?: ReactNode;
  /** Error message. When present, the field is rendered in error state. */
  error?: string;
  /** When true, renders a red `*` next to the label. */
  required?: boolean;
  /** Wrapper className for layout overrides. */
  className?: string;
  /** id of the control. Auto-generated when omitted. */
  htmlFor?: string;
  /** Optional content rendered to the right of the label. */
  trailing?: ReactNode;
}

export interface FormFieldProps extends FormFieldBaseProps {
  children: (controlProps: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required,
  className,
  htmlFor,
  trailing,
  children,
}: FormFieldProps) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
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
        {trailing}
      </div>

      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}

      {children({
        id,
        "aria-invalid": Boolean(error),
        "aria-describedby": describedBy,
      })}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="flex items-start gap-1 text-xs font-medium text-destructive"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

const CONTROL_CLASS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

const ERROR_CONTROL_CLASS = "border-destructive focus:ring-destructive";

export type FormInputProps = FormFieldBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    { label, description, error, required, className, htmlFor, trailing, ...inputProps },
    ref,
  ) {
    return (
      <FormField
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
        htmlFor={htmlFor}
        trailing={trailing}
      >
        {(control) => (
          <input
            ref={ref}
            {...control}
            {...inputProps}
            className={cn(
              CONTROL_CLASS,
              error && ERROR_CONTROL_CLASS,
              inputProps.type === "search" && "pl-9",
            )}
          />
        )}
      </FormField>
    );
  },
);

export type FormTextareaProps = FormFieldBaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">;

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    { label, description, error, required, className, htmlFor, trailing, rows = 4, ...textareaProps },
    ref,
  ) {
    return (
      <FormField
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
        htmlFor={htmlFor}
        trailing={trailing}
      >
        {(control) => (
          <textarea
            ref={ref}
            rows={rows}
            {...control}
            {...textareaProps}
            className={cn(
              CONTROL_CLASS,
              "min-h-[80px] py-2",
              error && ERROR_CONTROL_CLASS,
            )}
          />
        )}
      </FormField>
    );
  },
);

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type FormSelectProps = FormFieldBaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "className" | "children"> & {
    options: FormSelectOption[];
    placeholder?: string;
  };

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    {
      label,
      description,
      error,
      required,
      className,
      htmlFor,
      trailing,
      options,
      placeholder,
      ...selectProps
    },
    ref,
  ) {
    return (
      <FormField
        label={label}
        description={description}
        error={error}
        required={required}
        className={className}
        htmlFor={htmlFor}
        trailing={trailing}
      >
        {(control) => (
          <select
            ref={ref}
            {...control}
            {...selectProps}
            className={cn(
              CONTROL_CLASS,
              "appearance-none bg-no-repeat pr-8",
              error && ERROR_CONTROL_CLASS,
            )}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
              backgroundPosition: "right 0.625rem center",
              backgroundSize: "1rem",
            }}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        )}
      </FormField>
    );
  },
);
