"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Skeleton,
} from "@/components/admin/primitives";
import { useAuth } from "@/hooks/useAuth";
import * as donorsApi from "@/lib/api/donors";
import { toApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_LABELS,
  DONOR_MAX_AGE,
  DONOR_MAX_WEIGHT_KG,
  DONOR_MIN_AGE,
  DONOR_MIN_WEIGHT_KG,
} from "@/lib/constants";
import { donorProfileSchema, type DonorProfileInput } from "@/lib/zod-schemas";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import {
  CalendarIcon,
  DropletIcon,
  HeartPulseIcon,
  UploadCloudIcon,
} from "@/components/donor/icons";
import { toast } from "@/app/providers";
import type { BloodGroup, DonorProfile, User } from "@/types";

/* ----------------------------------------------------------------------
   /donor/profile — Donor profile (create + edit)
   ----------------------------------------------------------------------
   When the donor has no profile, the page renders the CREATE form.
   When the profile exists, the page renders:
     1. Avatar uploader (Cloudinary unsigned upload, falls back to
        local-only preview if env vars are missing).
     2. Edit form prefilled with the current profile.
     3. Read-only summary card (total donations, last donation,
        eligibility).
   ---------------------------------------------------------------------- */

interface FormValues {
  bloodGroup: BloodGroup;
  location: string;
  weightKg: string;
  ageYears: string;
}

const EMPTY: FormValues = {
  bloodGroup: "O_POSITIVE",
  location: "",
  weightKg: "",
  ageYears: "",
};

export default function DonorProfilePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const profileQuery = useQuery<DonorProfile | null, Error>({
    queryKey: ["donors", "profile"],
    queryFn: async () => {
      try {
        return await donorsApi.getMyProfile();
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (status === 404) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  const [values, setValues] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  // Hydrate the form whenever the profile lands.
  useEffect(() => {
    if (profileQuery.data && values === null) {
      setValues({
        bloodGroup: profileQuery.data.bloodGroup,
        location: profileQuery.data.location,
        weightKg: String(profileQuery.data.weightKg),
        ageYears: String(profileQuery.data.ageYears),
      });
    }
  }, [profileQuery.data, values]);

  const createMutation = useMutation({
    mutationFn: (input: DonorProfileInput) => donorsApi.createProfile(input),
    onSuccess: () => {
      toast.success("Profile created", "You are now visible in donor searches.");
      void queryClient.invalidateQueries({ queryKey: ["donors", "profile"] });
    },
    onError: (error) => {
      toast.error("Failed to create profile", toApiError(error).message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: Partial<DonorProfileInput>) => donorsApi.updateProfile(input),
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["donors", "profile"] });
    },
    onError: (error) => {
      toast.error("Failed to update profile", toApiError(error).message);
    },
  });

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
    if (errors[key]) {
      setErrors((prev) => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values) return;
    const parsed = {
      bloodGroup: values.bloodGroup,
      location: values.location,
      weightKg: Number(values.weightKg),
      ageYears: Number(values.ageYears),
    };
    const result = donorProfileSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key as keyof FormValues]) {
          fieldErrors[key as keyof FormValues] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    if (profileQuery.data) {
      updateMutation.mutate(result.data);
    } else {
      createMutation.mutate(result.data);
    }
  }

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (profileQuery.data && values) {
    return (
      <EditView
        profile={profileQuery.data}
        user={user}
        values={values}
        errors={errors}
        update={update}
        onSubmit={handleSubmit}
        saving={updateMutation.isPending}
      />
    );
  }

  return (
    <CreateView
      values={values ?? EMPTY}
      errors={errors}
      update={update}
      onSubmit={handleSubmit}
      saving={createMutation.isPending}
    />
  );
}

/* ----------------------------------------------------------------------
   Create view
   ---------------------------------------------------------------------- */
function CreateView({
  values,
  errors,
  update,
  onSubmit,
  saving,
}: {
  values: FormValues;
  errors: Partial<Record<keyof FormValues, string>>;
  update: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Create your donor profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about yourself so we can match you with compatible requests.
        </p>
      </header>

      <Card>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Blood group"
              error={errors.bloodGroup}
              required
            >
              <Select
                value={values.bloodGroup}
                onChange={(event) =>
                  update("bloodGroup", event.target.value as BloodGroup)
                }
                options={BLOOD_GROUPS.map((g) => ({
                  value: g,
                  label: BLOOD_GROUP_LABELS[g],
                }))}
              />
            </Field>

            <Field
              label="Location"
              error={errors.location}
              required
            >
              <Input
                value={values.location}
                onChange={(event) => update("location", event.target.value)}
                placeholder="e.g. Sylhet, Bangladesh"
              />
            </Field>

            <Field
              label="Weight (kg)"
              hint={`Minimum ${DONOR_MIN_WEIGHT_KG} kg to be eligible`}
              error={errors.weightKg}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_WEIGHT_KG}
                max={DONOR_MAX_WEIGHT_KG}
                value={values.weightKg}
                onChange={(event) => update("weightKg", event.target.value)}
              />
            </Field>

            <Field
              label="Age (years)"
              hint={`Must be between ${DONOR_MIN_AGE} and ${DONOR_MAX_AGE}`}
              error={errors.ageYears}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_AGE}
                max={DONOR_MAX_AGE}
                value={values.ageYears}
                onChange={(event) => update("ageYears", event.target.value)}
              />
            </Field>

            <div className="sm:col-span-2 flex items-center justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Edit view
   ---------------------------------------------------------------------- */
function EditView({
  profile,
  user,
  values,
  errors,
  update,
  onSubmit,
  saving,
}: {
  profile: DonorProfile;
  user: User | null;
  values: FormValues;
  errors: Partial<Record<keyof FormValues, string>>;
  update: <K extends keyof FormValues>(key: K, value: FormValues[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
}) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Local-only preview if Cloudinary env vars are missing.
    if (!cloudName || !uploadPreset) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      toast.info("Local preview", "Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + preset to enable real uploads.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Upload failed");
      const json = (await res.json()) as { secure_url?: string };
      if (json.secure_url) {
        setAvatarUrl(json.secure_url);
        toast.success("Photo uploaded");
      }
    } catch (error) {
      toast.error("Upload failed", (error as Error).message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const displayAvatar = avatarUrl ?? user?.avatarUrl ?? null;
  const eligible = isEligible(profile.lastDonationAt);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Donor profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your blood donation profile
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Photo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span
            aria-hidden
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-primary/10 text-2xl font-semibold text-primary"
          >
            {displayAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={displayAvatar}
                alt="Your avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials(user?.name)}</span>
            )}
          </span>
          <div className="flex flex-col gap-2">
            <label
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <UploadCloudIcon size={14} />
              {uploading ? "Uploading…" : "Upload photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or WEBP. Max 5 MB. Cloudinary unsigned upload.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Blood group"
              error={errors.bloodGroup}
              required
            >
              <Select
                value={values.bloodGroup}
                onChange={(event) =>
                  update("bloodGroup", event.target.value as BloodGroup)
                }
                options={BLOOD_GROUPS.map((g) => ({
                  value: g,
                  label: BLOOD_GROUP_LABELS[g],
                }))}
              />
            </Field>

            <Field
              label="Location"
              error={errors.location}
              required
            >
              <Input
                value={values.location}
                onChange={(event) => update("location", event.target.value)}
              />
            </Field>

            <Field
              label="Weight (kg)"
              error={errors.weightKg}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_WEIGHT_KG}
                max={DONOR_MAX_WEIGHT_KG}
                value={values.weightKg}
                onChange={(event) => update("weightKg", event.target.value)}
              />
            </Field>

            <Field
              label="Age (years)"
              error={errors.ageYears}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_AGE}
                max={DONOR_MAX_AGE}
                value={values.ageYears}
                onChange={(event) => update("ageYears", event.target.value)}
              />
            </Field>

            <div className="sm:col-span-2 flex items-center justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <Info
            label="Total donations"
            value={String(profile.totalDonations ?? 0)}
            icon={<DropletIcon size={14} />}
          />
          <Info
            label="Last donation"
            value={
              profile.lastDonationAt
                ? formatRelativeTime(profile.lastDonationAt)
                : "Never"
            }
            icon={<CalendarIcon size={14} />}
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Eligibility
            </p>
            <div className="mt-1">
              {eligible ? (
                <Badge variant="success">Eligible to donate</Badge>
              ) : (
                <Badge variant="warning">
                  Next eligible in {daysUntilEligible(profile.lastDonationAt)} days
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Field
   ---------------------------------------------------------------------- */
function Field({
  label,
  error,
  required,
  hint,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span aria-hidden className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      {children}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {error ? <ErrorLine message={error} /> : null}
    </div>
  );
}

function Info({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        {value}
      </div>
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

/* ----------------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------------- */
function initials(name: string | null | undefined): string {
  if (!name) return "D";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "D"
  );
}

function isEligible(lastDonationAt: string | null | undefined): boolean {
  if (!lastDonationAt) return true;
  const last = new Date(lastDonationAt).getTime();
  if (Number.isNaN(last)) return true;
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return days >= 90;
}

function daysUntilEligible(lastDonationAt: string | null | undefined): number {
  if (!lastDonationAt) return 0;
  const last = new Date(lastDonationAt).getTime();
  if (Number.isNaN(last)) return 0;
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(90 - days));
}
