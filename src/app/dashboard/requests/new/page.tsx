"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Label,
  RadioGroup,
  Select,
  Textarea,
} from "@/components/admin/primitives";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import { extractApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { bloodRequestWizardSchema } from "@/lib/zod-schemas";
import { ArrowLeftIcon, CheckIcon, PlusCircleIcon } from "@/components/dashboard/icons";
import { toast } from "@/app/providers";

/* ----------------------------------------------------------------------
   /dashboard/requests/new — 3-step wizard
   ----------------------------------------------------------------------
   State machine: 1 (Patient) → 2 (Hospital) → 3 (Contact) → submit.
   On each Next click we run a per-step Zod validation (extracted from
   the combined `bloodRequestWizardSchema`) and only advance if the
   current step is valid. Submit runs the full schema, posts to
   `bloodRequestsApi.create`, and routes to the detail page.

   Field naming: the spec asked for `unitsNeeded` in step 1 but the
   backend / blood-requests contract uses `units`. The form keeps the
   API field name internally (so the create payload matches the
   schema) and labels the input "Units needed" in the UI.
   ---------------------------------------------------------------------- */

type WizardValues = z.infer<typeof bloodRequestWizardSchema>;

const EMPTY: WizardValues = {
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

const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof WizardValues>> = [
  ["patientName", "bloodGroup", "units"],
  ["hospitalName", "location", "priority"],
  ["contactName", "contactPhone", "notes"],
];

const STEP_LABELS = ["Patient", "Hospital", "Contact"] as const;

const PRIORITY_DOT: Record<WizardValues["priority"], string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-info",
  HIGH: "bg-warning",
  CRITICAL: "bg-destructive",
};

export default function NewRequestWizardPage() {
  const router = useRouter();
  const [values, setValues] = useState<WizardValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof WizardValues, string>>>({});
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof WizardValues>(key: K, value: WizardValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }

  function validateStep(index: 0 | 1 | 2): Partial<Record<keyof WizardValues, string>> {
    const shape = bloodRequestWizardSchema.pick(
      Object.fromEntries(STEP_FIELDS[index]!.map((k) => [k, true])) as Record<
        (typeof STEP_FIELDS)[number][number],
        true
      >,
    );
    const result = shape.safeParse(values);
    if (result.success) return {};
    const fieldErrors: Partial<Record<keyof WizardValues, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key as keyof WizardValues]) {
        fieldErrors[key as keyof WizardValues] = issue.message;
      }
    }
    return fieldErrors;
  }

  async function handleNext() {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return;
    }
    setStep((prev) => (Math.min(prev + 1, 2) as 0 | 1 | 2));
  }

  function handleBack() {
    setStep((prev) => (Math.max(prev - 1, 0) as 0 | 1 | 2));
  }

  async function handleSubmit() {
    const result = bloodRequestWizardSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof WizardValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key as keyof WizardValues]) {
          fieldErrors[key as keyof WizardValues] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const created = await bloodRequestsApi.create({
        patientName: result.data.patientName,
        bloodGroup: result.data.bloodGroup,
        units: result.data.units,
        priority: result.data.priority,
        hospitalName: result.data.hospitalName,
        location: result.data.location,
        neededAt: result.data.neededAt,
        contactName: result.data.contactName,
        contactPhone: result.data.contactPhone,
        notes: result.data.notes || undefined,
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
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          New Blood Request
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about the patient — we will handle the rest.
        </p>
      </header>

      <ProgressIndicator currentStep={step} />

      <Card>
        <CardContent className="space-y-4 p-6">
          {step === 0 ? <Step1 values={values} errors={errors} update={update} /> : null}
          {step === 1 ? <Step2 values={values} errors={errors} update={update} /> : null}
          {step === 2 ? (
            <Step3 values={values} errors={errors} update={update} />
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 0 || submitting}
            >
              <ArrowLeftIcon size={14} /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={handleNext} disabled={submitting}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit Request"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
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
type Updater = <K extends keyof WizardValues>(
  key: K,
  value: WizardValues[K],
) => void;

function Step1({
  values,
  errors,
  update,
}: {
  values: WizardValues;
  errors: Partial<Record<keyof WizardValues, string>>;
  update: Updater;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Patient name"
        value={values.patientName}
        onChange={(v) => update("patientName", v)}
        error={errors.patientName}
        placeholder="e.g. Ayesha Begum"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Blood group"
          value={values.bloodGroup}
          onChange={(v) => update("bloodGroup", v as WizardValues["bloodGroup"])}
          error={errors.bloodGroup}
          options={BLOOD_GROUPS.map((g) => ({ value: g, label: BLOOD_GROUP_LABELS[g] }))}
          required
        />
        <Field
          label="Units needed"
          type="number"
          min={1}
          max={10}
          value={String(values.units)}
          onChange={(v) => update("units", Number(v) || 0)}
          error={errors.units}
          required
        />
      </div>
    </div>
  );
}

function Step2({
  values,
  errors,
  update,
}: {
  values: WizardValues;
  errors: Partial<Record<keyof WizardValues, string>>;
  update: Updater;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Hospital name"
        value={values.hospitalName}
        onChange={(v) => update("hospitalName", v)}
        error={errors.hospitalName}
        placeholder="e.g. Square Hospital, Dhaka"
        required
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Location"
          value={values.location}
          onChange={(v) => update("location", v)}
          error={errors.location}
          placeholder="City or district"
          required
        />
        <Field
          label="Needed by"
          type="datetime-local"
          value={values.neededAt}
          onChange={(v) => update("neededAt", v)}
          error={errors.neededAt}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <RadioGroup
          value={values.priority}
          onValueChange={(v) => update("priority", v as WizardValues["priority"])}
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
        {errors.priority ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.priority}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Step3({
  values,
  errors,
  update,
}: {
  values: WizardValues;
  errors: Partial<Record<keyof WizardValues, string>>;
  update: Updater;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Contact name"
        value={values.contactName}
        onChange={(v) => update("contactName", v)}
        error={errors.contactName}
        placeholder="Family member or coordinator"
        required
      />
      <Field
        label="Contact phone"
        type="tel"
        value={values.contactPhone}
        onChange={(v) => update("contactPhone", v)}
        error={errors.contactPhone}
        placeholder="01712-345678"
        required
      />
      <TextareaField
        label="Notes (optional)"
        value={values.notes ?? ""}
        onChange={(v) => update("notes", v)}
        error={errors.notes}
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
   Field / TextareaField / SelectField
   ---------------------------------------------------------------------- */
function Field({
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  placeholder,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  const id = `wizard-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(error && "border-destructive focus:ring-destructive")}
      />
      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  rows?: number;
}) {
  const id = `wizard-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(error && "border-destructive focus:ring-destructive")}
      />
      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  error,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
}) {
  const id = `wizard-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        options={options}
        aria-invalid={Boolean(error)}
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
