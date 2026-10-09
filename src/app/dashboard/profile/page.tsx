"use client";

import { useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
} from "@/components/admin/primitives";
import { useAuth } from "@/hooks/useAuth";
import * as usersApi from "@/lib/api/users";
import { extractApiError } from "@/lib/api/_errors";
import { ROLE_LABELS } from "@/lib/constants";
import { profileUpdateSchema } from "@/lib/zod-schemas";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_ME_QUERY_KEY } from "@/hooks/useAuth";
import { CalendarIcon } from "@/components/dashboard/icons";
import { toast } from "@/app/providers";

/* ----------------------------------------------------------------------
   /dashboard/profile
   ----------------------------------------------------------------------
   Two-column layout: editable form on the left, account info card on
   the right. The /users/me call uses the existing `useQuery` so the
   avatar/name in the sidebar/topbar refreshes after a successful save
   (we invalidate `["auth","me"]`).
   ---------------------------------------------------------------------- */

interface FormValues {
  name: string;
  phone: string;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: storeUser, isHydrated } = useAuth();

  const meQuery = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: () => usersApi.getMe(),
    enabled: isHydrated,
    staleTime: 30_000,
  });

  const user = meQuery.data ?? storeUser;
  const [values, setValues] = useState<FormValues | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  // Hydrate the local form state when the user record lands.
  if (user && values === null) {
    setValues({ name: user.name ?? "", phone: user.phone ?? "" });
  }

  const mutation = useMutation({
    mutationFn: (input: FormValues) => usersApi.updateMe(input),
    onSuccess: () => {
      toast.success("Profile updated", "Your account details were saved.");
      void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
    },
    onError: (error) => {
      toast.error("Failed to update", extractApiError(error));
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
    const result = profileUpdateSchema.safeParse(values);
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
    mutation.mutate(result.data);
  }

  if (meQuery.isLoading || !user || !values) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted/40"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div>
                  <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={values.name}
                  onChange={(event) => update("name", event.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  className={errors.name ? "border-destructive focus:ring-destructive" : ""}
                />
                {errors.name ? <ErrorLine message={errors.name} /> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  value={values.phone}
                  placeholder="01712-345678"
                  onChange={(event) => update("phone", event.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  className={errors.phone ? "border-destructive focus:ring-destructive" : ""}
                />
                {errors.phone ? <ErrorLine message={errors.phone} /> : null}
              </div>
              <div className="flex items-center justify-end pt-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info
              label="Member since"
              value={formatDate(user.createdAt)}
              icon={<CalendarIcon size={14} />}
            />
            <Info
              label="Last updated"
              value={
                <span title={formatDateTime(user.updatedAt)}>
                  {formatDateTime(user.updatedAt)}
                </span>
              }
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </p>
              <div className="mt-1">
                <Badge variant={user.status === "ACTIVE" ? "success" : "destructive"}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
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
