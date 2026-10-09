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
  Skeleton,
} from "@/components/admin/primitives";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import { AUTH_ME_QUERY_KEY, useAuth } from "@/hooks/useAuth";
import * as usersApi from "@/lib/api/users";
import { extractApiError } from "@/lib/api/_errors";
import { ROLE_LABELS } from "@/lib/constants";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/zod-schemas";
import { formatDate, formatDateTime } from "@/lib/utils";
import { CalendarIcon } from "@/components/dashboard/icons";
import { toast } from "@/app/providers";

/* ----------------------------------------------------------------------
   /dashboard/profile
   ----------------------------------------------------------------------
   RHF + Zod. Two-column layout: editable form on the left, account info
   card on the right.
   ---------------------------------------------------------------------- */

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

  const [hydrated, setHydrated] = useState(false);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    mode: "onChange",
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (user && !hydrated) {
      form.reset({ name: user.name ?? "", phone: user.phone ?? "" });
      setHydrated(true);
    }
  }, [user, hydrated, form]);

  const mutation = useMutation({
    mutationFn: (input: ProfileUpdateInput) => usersApi.updateMe(input),
    onSuccess: () => {
      toast.success("Profile updated", "Your account details were saved.");
      void queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY });
    },
    onError: (error) => {
      toast.error("Failed to update", extractApiError(error));
    },
  });

  function onSubmit(values: ProfileUpdateInput) {
    mutation.mutate(values);
  }

  if (meQuery.isLoading || !user) {
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
    <PageContainer className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your account"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
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
                  {...form.register("name")}
                  aria-invalid={Boolean(form.formState.errors.name)}
                  className={
                    form.formState.errors.name
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }
                />
                {form.formState.errors.name ? (
                  <ErrorLine message={form.formState.errors.name.message ?? "Invalid"} />
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input
                  id="profile-phone"
                  type="tel"
                  placeholder="01712-345678"
                  {...form.register("phone")}
                  aria-invalid={Boolean(form.formState.errors.phone)}
                  className={
                    form.formState.errors.phone
                      ? "border-destructive focus:ring-destructive"
                      : ""
                  }
                />
                {form.formState.errors.phone ? (
                  <ErrorLine message={form.formState.errors.phone.message ?? "Invalid"} />
                ) : null}
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
                <Badge
                  variant={user.status === "ACTIVE" ? "success" : "destructive"}
                >
                  {user.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
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
    <p
      role="alert"
      className="flex items-center gap-1 text-xs font-medium text-destructive"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      {message}
    </p>
  );
}
