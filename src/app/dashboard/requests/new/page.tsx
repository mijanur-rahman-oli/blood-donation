"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseFormRegisterReturn } from "react-hook-form";

import {
  Button,
  Card,
  CardContent,
  Label,
  RadioGroup,
  Select,
  Textarea,
} from "@/components/admin/primitives";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import { extractApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { bloodRequestWizardSchema, type BloodRequestWizardInput } from "@/lib/zod-schemas";
import { ArrowLeftIcon, CheckIcon } from "@/components/dashboard/icons";
import { toast } from "@/app/providers";



const STEP_LABELS = ["Patient", "Hospital", "Contact"] as const;

const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof BloodRequestWizardInput>> = [
  ["patientName", "bloodGroup", "units"],
  ["hospitalName", "location", "neededAt", "priority"],
  ["contactName", "contactPhone", "notes"],
];

const PRIORITY_DOT: Record<BloodRequestWizardInput["priority"], string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-info",
  HIGH: "bg-warning",
  CRITICAL: "bg-destructive",
};

const DEFAULT_VALUES: BloodRequestWizardInput = {
  patientName: "",
  bloodGroup: "O_POSITIVE",
  units: 1,
  priority: "MEDIUM",
  hospitalName: "",
  location: "",
  neededAt: "",
  contactName: "",
  contactPhone: "",
  notes: "",
};

export default function NewRequestWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BloodRequestWizardInput>({
    resolver: zodResolver(bloodRequestWizardSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  async function handleNext() {
    const fields = STEP_FIELDS[step]!;
    const result = await form.trigger(fields);
    if (result) {
      setStep((prev) => (Math.min(prev + 1, 2) as 0 | 1 | 2));
    }
  }

  function handleBack() {
    setStep((prev) => (Math.max(prev - 1, 0) as 0 | 1 | 2));
  }

  async function onSubmit(values: BloodRequestWizardInput) {
    setSubmitting(true);
    try {
      // Field map between the wizard's form state and the backend's
      // create endpoint. Differences are noted inline.
      const created = await bloodRequestsApi.create({
        patientName: values.patientName,
        bloodGroup: values.bloodGroup,
        unitsNeeded: values.units, // form field `units` → API `unitsNeeded`
        priority: values.priority,
        hospitalName: values.hospitalName,
        location: values.location,
        contactPhone: values.contactPhone,
        notes: values.notes || undefined,
        // `neededAt` and `contactName` are captured by the form for
        // local UI state but the current backend create endpoint
        // does not accept them — do not send them, or the request
        // is rejected with 400. Once the backend grows those fields
        // (or a "draft" endpoint) they can be added here.
      });
      toast.success(
        "Blood request created",
        "An admin will review and assign a donor shortly.",
      );
      router.push(`/dashboard/requests/${created.id}`);
    } catch (error) {
      toast.error("Failed to create request", extractApiError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="New Blood Request"
        description="Tell us about the patient — we will handle the rest."
      />

      <ProgressIndicator currentStep={step} />

      <Card>
        <CardContent className="space-y-4 p-6">
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {step === 0 ? <Step1 form={form} /> : null}
            {step === 1 ? <Step2 form={form} /> : null}
            {step === 2 ? <Step3 form={form} /> : null}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 0 || submitting}
              >
                <ArrowLeftIcon size={14} /> Back
              </Button>
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={submitting}
                >
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit Request"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}

/* ----------------------------------------------------------------------
   Progress indicator
   ---------------------------------------------------------------------- */
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {STEP_LABELS.map((label, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <li key={label} className="flex flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? <CheckIcon size={14} /> : idx + 1}
              </span>
              {idx < STEP_LABELS.length - 1 ? (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ----------------------------------------------------------------------
   Steps
   ---------------------------------------------------------------------- */
type Form = ReturnType<typeof useForm<BloodRequestWizardInput>>;

function Step1({ form }: { form: Form }) {
  return (
    <div className="space-y-4">
      <Field
        label="Patient name"
        registration={form.register("patientName")}
        error={form.formState.errors.patientName?.message}
        placeholder="e.g. Ayesha Begum"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Blood group"
          error={form.formState.errors.bloodGroup?.message}
          name="bloodGroup"
          required
        >
          <Select
            value={form.watch("bloodGroup")}
            onChange={(event) =>
              form.setValue(
                "bloodGroup",
                event.target.value as BloodRequestWizardInput["bloodGroup"],
                { shouldValidate: true, shouldDirty: true },
              )
            }
            options={BLOOD_GROUPS.map((g) => ({
              value: g,
              label: BLOOD_GROUP_LABELS[g],
            }))}
          />
        </Field>
        <Field
          label="Units needed"
          registration={form.register("units", { valueAsNumber: true })}
          error={form.formState.errors.units?.message}
          type="number"
          min={1}
          max={10}
          required
        />
      </div>
    </div>
  );
}

function Step2({ form }: { form: Form }) {
  return (
    <div className="space-y-4">
      <Field
        label="Hospital name"
        registration={form.register("hospitalName")}
        error={form.formState.errors.hospitalName?.message}
        placeholder="e.g. Square Hospital, Dhaka"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Location"
          registration={form.register("location")}
          error={form.formState.errors.location?.message}
          placeholder="City or district"
          required
        />
        <Field
          label="Needed by"
          registration={form.register("neededAt")}
          error={form.formState.errors.neededAt?.message}
          type="datetime-local"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <RadioGroup
          value={form.watch("priority")}
          onValueChange={(v) =>
            form.setValue(
              "priority",
              v as BloodRequestWizardInput["priority"],
              { shouldValidate: true, shouldDirty: true },
            )
          }
          options={PRIORITIES.map((p) => ({
            value: p,
            label: PRIORITY_LABELS[p],
            description:
              p === "CRITICAL"
                ? "Life-threatening — assign the closest donor first"
                : p === "HIGH"
                ? "Urgent — within the next few hours"
                : p === "MEDIUM"
                ? "Same-day response"
                : "Routine request",
          }))}
        />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {PRIORITIES.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[p])} />
              {PRIORITY_LABELS[p]}
            </span>
          ))}
        </div>
        {form.formState.errors.priority ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {form.formState.errors.priority.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Step3({ form }: { form: Form }) {
  const values = form.watch();
  return (
    <div className="space-y-4">
      {/*
        `contactName` is captured by the form for local UI state but
        the current backend create endpoint does not accept it (see
        onSubmit). It's kept here so the wizard can grow once the
        backend adds the field.
      */}
      <Field
        label="Contact name"
        registration={form.register("contactName")}
        error={form.formState.errors.contactName?.message}
        placeholder="Family member or coordinator"
        required
      />
      <Field
        label="Contact phone"
        registration={form.register("contactPhone")}
        error={form.formState.errors.contactPhone?.message}
        type="tel"
        placeholder="01712-345678"
        required
      />
      <TextareaField
        label="Notes (optional)"
        registration={form.register("notes")}
        error={form.formState.errors.notes?.message}
        placeholder="Anything the admin should know…"
        rows={4}
      />

      <Card className="bg-muted/30">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="text-sm font-semibold text-foreground">Review</p>
          <ReviewRow
            label="Patient"
            value={`${values.patientName} · ${BLOOD_GROUP_LABELS[values.bloodGroup]} · ${values.units} unit${values.units === 1 ? "" : "s"}`}
          />
          <ReviewRow
            label="Hospital"
            value={`${values.hospitalName} · ${values.location}`}
          />
          <ReviewRow
            label="Priority"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className={cn("h-2 w-2 rounded-full", PRIORITY_DOT[values.priority])} />
                {PRIORITY_LABELS[values.priority]}
              </span>
            }
          />
          {values.notes ? <ReviewRow label="Notes" value={values.notes} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm text-foreground">{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Field / TextareaField
   ---------------------------------------------------------------------- */
interface FieldProps {
  label: string;
  registration?: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  children?: React.ReactNode;
  /** Required when `children` is omitted so the input id is stable. */
  name?: string;
}

function Field({
  label,
  registration,
  error,
  required,
  type = "text",
  placeholder,
  min,
  max,
  children,
  name,
}: FieldProps) {
  const id = `wizard-${registration?.name ?? name ?? "field"}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children ? (
        children
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          min={min}
          max={max}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            error && "border-destructive focus:ring-destructive",
          )}
          {...registration}
        />
      )}
      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

function TextareaField({
  label,
  registration,
  error,
  required,
  placeholder,
  rows = 4,
}: TextareaFieldProps) {
  const id = `wizard-${registration.name}`;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={cn(
          error && "border-destructive focus:ring-destructive",
        )}
        {...registration}
      />
      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

function ErrorLine({ message }: { message: string }) {
  return (
    <p role="alert" className="flex items-center gap-1 text-xs font-medium text-destructive">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </p>
  );
}
