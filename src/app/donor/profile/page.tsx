"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { extractApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUPS,
  BLOOD_GROUP_LABELS,
  DONOR_MAX_AGE,
  DONOR_MAX_WEIGHT_KG,
  DONOR_MIN_AGE,
  DONOR_MIN_WEIGHT_KG,
} from "@/lib/constants";
import { donorProfileFormSchema, type DonorProfileFormInput, type DonorProfileInput } from "@/lib/zod-schemas";
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
   /donor/profile
   ----------------------------------------------------------------------
   RHF + Zod. The page handles both create (when the donor has no
   profile) and edit. The create form shares the same RHF instance as
   the edit form by branching on the resolved schema.
   ---------------------------------------------------------------------- */

const DEFAULT_VALUES: DonorProfileFormInput = {
  bloodGroup: "O_POSITIVE",
  location: "",
  weightKg: 0,
  ageYears: 0,
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
        const status = (extractApiError(error).match(/\b(\d{3})\b/) ?? [
          undefined,
        ])[0];
        if (status === "404") return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  const [hydrated, setHydrated] = useState(false);

  const form = useForm<DonorProfileFormInput>({
    resolver: zodResolver(donorProfileFormSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (profileQuery.data && !hydrated) {
      form.reset({
        bloodGroup: profileQuery.data.bloodGroup,
        location: profileQuery.data.location,
        weightKg: profileQuery.data.weightKg,
        ageYears: profileQuery.data.ageYears,
      });
      setHydrated(true);
    }
  }, [profileQuery.data, hydrated, form]);

  const createMutation = useMutation({
    mutationFn: (input: DonorProfileFormInput) => donorsApi.createProfile(input),
    onSuccess: () => {
      toast.success("Profile created", "You are now visible in donor searches.");
      void queryClient.invalidateQueries({ queryKey: ["donors", "profile"] });
    },
    onError: (error) => {
      toast.error("Failed to create profile", extractApiError(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (input: Partial<DonorProfileInput>) => donorsApi.updateProfile(input),
    onSuccess: () => {
      toast.success("Profile updated");
      void queryClient.invalidateQueries({ queryKey: ["donors", "profile"] });
    },
    onError: (error) => {
      toast.error("Failed to update profile", extractApiError(error));
    },
  });

  function onSubmit(values: DonorProfileFormInput) {
    if (profileQuery.data) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
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

  if (profileQuery.data) {
    return <EditView user={user} form={form} onSubmit={onSubmit} saving={updateMutation.isPending} />;
  }

  return (
    <CreateView
      form={form}
      onSubmit={onSubmit}
      saving={createMutation.isPending}
    />
  );
}

/* ----------------------------------------------------------------------
   Create view
   ---------------------------------------------------------------------- */
function CreateView({
  form,
  onSubmit,
  saving,
}: {
  form: ReturnType<typeof useForm<DonorProfileFormInput>>;
  onSubmit: (values: DonorProfileFormInput) => void;
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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            noValidate
          >
            <Field
              label="Blood group"
              error={form.formState.errors.bloodGroup?.message}
              required
            >
              <Select
                value={form.watch("bloodGroup")}
                onChange={(event) =>
                  form.setValue(
                    "bloodGroup",
                    event.target.value as BloodGroup,
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
              label="Location"
              error={form.formState.errors.location?.message}
              required
            >
              <Input
                placeholder="e.g. Sylhet, Bangladesh"
                {...form.register("location")}
                aria-invalid={Boolean(form.formState.errors.location)}
                className={cn(
                  form.formState.errors.location &&
                    "border-destructive focus:ring-destructive",
                )}
              />
            </Field>

            <Field
              label="Weight (kg)"
              hint={`Minimum ${DONOR_MIN_WEIGHT_KG} kg to be eligible`}
              error={form.formState.errors.weightKg?.message}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_WEIGHT_KG}
                max={DONOR_MAX_WEIGHT_KG}
                {...form.register("weightKg", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.weightKg)}
                className={cn(
                  form.formState.errors.weightKg &&
                    "border-destructive focus:ring-destructive",
                )}
              />
            </Field>

            <Field
              label="Age (years)"
              hint={`Must be between ${DONOR_MIN_AGE} and ${DONOR_MAX_AGE}`}
              error={form.formState.errors.ageYears?.message}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_AGE}
                max={DONOR_MAX_AGE}
                {...form.register("ageYears", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.ageYears)}
                className={cn(
                  form.formState.errors.ageYears &&
                    "border-destructive focus:ring-destructive",
                )}
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
  user,
  form,
  onSubmit,
  saving,
}: {
  user: User | null;
  form: ReturnType<typeof useForm<DonorProfileFormInput>>;
  onSubmit: (values: DonorProfileFormInput) => void;
  saving: boolean;
}) {
  const profile = form.watch();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!cloudName || !uploadPreset) {
      const objectUrl = URL.createObjectURL(file);
      setAvatarUrl(objectUrl);
      toast.info(
        "Local preview",
        "Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + preset to enable real uploads.",
      );
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
  const eligible = isEligible(profile.weightKg, profile.ageYears);

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
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            noValidate
          >
            <Field
              label="Blood group"
              error={form.formState.errors.bloodGroup?.message}
              required
            >
              <Select
                value={form.watch("bloodGroup")}
                onChange={(event) =>
                  form.setValue(
                    "bloodGroup",
                    event.target.value as BloodGroup,
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
              label="Location"
              error={form.formState.errors.location?.message}
              required
            >
              <Input
                {...form.register("location")}
                aria-invalid={Boolean(form.formState.errors.location)}
                className={cn(
                  form.formState.errors.location &&
                    "border-destructive focus:ring-destructive",
                )}
              />
            </Field>

            <Field
              label="Weight (kg)"
              error={form.formState.errors.weightKg?.message}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_WEIGHT_KG}
                max={DONOR_MAX_WEIGHT_KG}
                {...form.register("weightKg", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.weightKg)}
                className={cn(
                  form.formState.errors.weightKg &&
                    "border-destructive focus:ring-destructive",
                )}
              />
            </Field>

            <Field
              label="Age (years)"
              error={form.formState.errors.ageYears?.message}
              required
            >
              <Input
                type="number"
                min={DONOR_MIN_AGE}
                max={DONOR_MAX_AGE}
                {...form.register("ageYears", { valueAsNumber: true })}
                aria-invalid={Boolean(form.formState.errors.ageYears)}
                className={cn(
                  form.formState.errors.ageYears &&
                    "border-destructive focus:ring-destructive",
                )}
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
            value={String(0)}
            icon={<DropletIcon size={14} />}
          />
          <Info
            label="Last donation"
            value={formatRelativeTime(null)}
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
                  Weight / age out of range
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        <CardContent className="border-t border-border pt-4 text-xs text-muted-foreground">
          Member since {formatDate(new Date().toISOString())}
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

function isEligible(weightKg: number, ageYears: number): boolean {
  return weightKg >= 50 && ageYears >= 18 && ageYears <= 65;
}
