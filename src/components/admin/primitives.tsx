"use client";

/**
 * Tiny shadcn-style primitives.
 *
 * Stand-ins for the components the admin pages reference but which are
 * not yet installed in this workspace (shadcn has not been initialised,
 * and the matching Radix packages are not in package.json). They expose
 * the same prop shape as the shadcn components they replace, so when
 * `npx shadcn@latest add …` is run the call sites stay untouched.
 *
 * Covers:
 *   - Card, CardHeader, CardTitle, CardDescription, CardContent,
 *     CardFooter
 *   - Button (variants: default | outline | ghost | destructive)
 *   - Badge (variants: default | outline | secondary | destructive |
 *     success | warning | info)
 *   - Skeleton
 *   - Separator
 *   - Input, Label, Textarea
 *   - Select (native <select> wrapper)
 *   - Dialog, DialogContent, DialogHeader, DialogTitle,
 *     DialogDescription, DialogFooter (focus trap + Escape handling)
 *   - DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
 *     DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator
 *
 * Everything is dependency-free: no @radix-ui/* runtime, no class-
 * variance-authority (the `cva` helper is implemented inline).
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

/* ====================================================================
   cn helper (local copy so this file is self-contained)
   ==================================================================== */
type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassDictionary
  | ClassArray;
interface ClassDictionary {
  [id: string]: boolean | undefined | null | string | number;
}
interface ClassArray extends Array<ClassValue> {}

/* ====================================================================
   Card
   ==================================================================== */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
          className,
        )}
        {...props}
      />
    );
  },
);

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1 border-b border-border p-5", className)}
        {...props}
      />
    );
  },
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn("text-base font-semibold leading-tight text-foreground", className)}
        {...props}
      />
    );
  },
);

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div ref={ref} className={cn("p-5", className)} {...props} />;
  },
);

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-end gap-2 border-t border-border p-5", className)}
        {...props}
      />
    );
  },
);

/* ====================================================================
   Button
   ==================================================================== */
export type ButtonVariant = "default" | "outline" | "ghost" | "destructive";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary-hover",
  outline: "border border-border bg-background text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};
const BUTTON_SIZE: Record<ButtonSize, string> = {
  default: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
});

/* ====================================================================
   Badge
   ==================================================================== */
export type BadgeVariant =
  | "default"
  | "outline"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "primary";

const BADGE_VARIANT: Record<BadgeVariant, string> = {
  default: "border border-border bg-muted text-foreground",
  outline: "border border-border bg-background text-foreground",
  secondary: "border border-secondary bg-secondary text-secondary-foreground",
  destructive:
    "border border-destructive/30 bg-destructive/10 text-destructive",
  success: "border border-success/30 bg-success/10 text-success",
  warning: "border border-warning/30 bg-warning/10 text-warning",
  info: "border border-info/30 bg-info/10 text-info",
  primary: "border border-primary/30 bg-primary/10 text-primary",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE_VARIANT[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ====================================================================
   Skeleton
   ==================================================================== */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/* ====================================================================
   Separator
   ==================================================================== */
export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: HTMLAttributes<HTMLDivElement> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

/* ====================================================================
   Input / Label / Textarea
   ==================================================================== */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn("text-sm font-medium leading-none text-foreground", className)}
        {...props}
      />
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

/* ====================================================================
   Select (native <select> wrapper styled to match the design system)
   ==================================================================== */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, placeholder, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
        backgroundPosition: "right 0.625rem center",
        backgroundSize: "1rem",
        backgroundRepeat: "no-repeat",
      }}
      {...props}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

/* ====================================================================
   Dialog (focus trap + Escape handling)
   ==================================================================== */
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const value = useMemo<DialogContextValue>(
    () => ({ open, setOpen: onOpenChange, titleId, descriptionId }),
    [open, onOpenChange, titleId, descriptionId],
  );
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

function useDialog(): DialogContextValue {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("Dialog components must be used inside <Dialog>");
  return ctx;
}

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  const { open, setOpen, titleId, descriptionId } = useDialog();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
        return;
      }
      if (event.key === "Tab" && containerRef.current) {
        const focusables = containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    // Move focus into the dialog after mount.
    const id = window.setTimeout(() => {
      const target = containerRef.current?.querySelector<HTMLElement>(
        "[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      target?.focus();
    }, 0);

    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(id);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          "relative w-full max-w-lg rounded-xl border border-border bg-background p-0 shadow-2xl",
          "max-h-[90vh] overflow-y-auto",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1 border-b border-border p-5", className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useDialog();
  return (
    <h2
      id={titleId}
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useDialog();
  return (
    <p
      id={descriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse items-stretch gap-2 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

/* ====================================================================
   DropdownMenu (popover-style; positions under the trigger)
   ==================================================================== */
interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

export interface DropdownMenuProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<DropdownContextValue>(
    () => ({ open, setOpen, triggerRef }),
    [open],
  );

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      const root = (target as HTMLElement).closest?.("[data-dropdown-root]");
      if (root) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={value}>
      <div data-dropdown-root className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function useDropdown(): DropdownContextValue {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("DropdownMenu components must be used inside <DropdownMenu>");
  return ctx;
}

interface DropdownMenuTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: ReactNode;
}

export const DropdownMenuTrigger = forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(function DropdownMenuTrigger({ children, onClick, ...props }, ref) {
  const { open, setOpen, triggerRef } = useDropdown();
  const innerRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    },
    [ref, triggerRef],
  );
  return (
    <button
      ref={innerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={(event) => {
        setOpen(!open);
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
});

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end";
}

export function DropdownMenuContent({
  className,
  align = "end",
  ...props
}: DropdownMenuContentProps) {
  const { open } = useDropdown();
  if (!open) return null;
  return (
    <div
      role="menu"
      className={cn(
        "absolute z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuItem({
  className,
  ...props
}: HTMLAttributes<HTMLButtonElement> & { disabled?: boolean }) {
  return (
    <button
      role="menuitem"
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}

/* ====================================================================
   RadioGroup (native semantics via role=radio)
   ==================================================================== */
export interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string; description?: string }>;
  name?: string;
  className?: string;
}

export function RadioGroup({ value, onValueChange, options, className }: RadioGroupProps) {
  return (
    <div role="radiogroup" className={cn("space-y-2", className)}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <button
            type="button"
            key={option.value}
            role="radio"
            aria-checked={checked}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex w-full items-start gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              checked ? "border-primary" : "border-border",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                checked ? "border-primary" : "border-muted-foreground/40",
              )}
            >
              {checked ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                {option.label}
              </span>
              {option.description ? (
                <span className="block text-xs text-muted-foreground">
                  {option.description}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
