"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  Textarea,
} from "@/components/admin/primitives";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageContainer } from "@/components/shared/PageContainer";
import { PageHeader } from "@/components/shared/PageHeader";
import * as donorsApi from "@/lib/api/donors";
import { toApiError } from "@/lib/api/_errors";
import * as assignmentsApi from "@/lib/api/assignments";
import { BLOOD_GROUP_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import {
  CalendarIcon,
  CheckIcon,
  DropletIcon,
  HeartPulseIcon,
  MapPinIcon,
  XCircleIcon,
} from "@/components/donor/icons";
import { cn, formatRelativeTime } from "@/lib/utils";
import { toast } from "@/app/providers";
import type {
  AssignmentStatus,
  BloodRequest,
  DonationHistory,
  DonorProfile,
  PaginatedResult,
  Priority,
} from "@/types";

/* ----------------------------------------------------------------------
   /donor — Donor dashboard
   ----------------------------------------------------------------------
   Renders the donor's availability toggle, profile summary (or a CTA
   to /donor/profile when missing), the active assignments, a preview
   of compatible requests, and a preview of recent donations.
   ---------------------------------------------------------------------- */

const HISTORY_LIMIT = 5;
const REQUESTS_LIMIT = 5;

export default function DonorDashboardPage() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery<DonorProfile | null, Error>({
    queryKey: ["donors", "profile"],
    queryFn: async () => {
      try {
        return await donorsApi.getMyProfile();
      } catch (error) {
        const apiError = toApiError(error, "");
        if (apiError.status === 404) return null;
        throw apiError;
      }
    },
    retry: false,
    staleTime: 30_000,
  });

  const compatibleQuery = useQuery<PaginatedResult<BloodRequest>, Error>({
    queryKey: ["donors", "requests", { page: 1, limit: REQUESTS_LIMIT }],
    queryFn: () =>
      donorsApi.getCompatibleRequests({ page: 1, limit: REQUESTS_LIMIT }),
    staleTime: 30_000,
  });

  const historyQuery = useQuery<PaginatedResult<DonationHistory>, Error>({
    queryKey: ["donors", "donation-history", { page: 1, limit: HISTORY_LIMIT }],
    queryFn: () =>
      donorsApi.getDonationHistory({ page: 1, limit: HISTORY_LIMIT }),
    staleTime: 30_000,
  });

  const availabilityMutation = useMutation({
    mutationFn: (input: { availability: boolean }) =>
      donorsApi.updateAvailability(input),
    onMutate: async ({ availability }) => {
      await queryClient.cancelQueries({ queryKey: ["donors", "profile"] });
      const previous = queryClient.getQueryData<DonorProfile | null>([
        "donors",
        "profile",
      ]);
      if (previous) {
        queryClient.setQueryData<DonorProfile | null>(
          ["donors", "profile"],
          (prev) => (prev ? { ...prev, availability } : prev),
        );
      }
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["donors", "profile"], context.previous);
      }
      toast.error(
        "Failed to update availability",
        toApiError(error).message,
      );
    },
    onSuccess: (_data, { availability }) => {
      toast.success(
        availability ? "You are now available" : "You are now unavailable",
        "Donor search results have been updated.",
      );
      void queryClient.invalidateQueries({ queryKey: ["donors", "profile"] });
    },
  });

  const assignments = useMemo<AssignmentLike[]>(() => {
    const requests = compatibleQuery.data?.result ?? [];
    return requests
      .filter((req) => req.assignment && isActive(req.assignment.status))
      .slice(0, 3)
      .map<AssignmentLike>((req) => ({
        id: req.assignment!.id,
        status: req.assignment!.status,
        assignedAt: req.assignment!.assignedAt,
        bloodRequest: req,
      }));
  }, [compatibleQuery.data]);

  const compatiblePreview = (compatibleQuery.data?.result ?? []).slice(0, 3);
  const historyPreview = (historyQuery.data?.result ?? []).slice(0, 3);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Donor Dashboard"
        description="Manage your availability and assignments"
      />

      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Availability
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {profileQuery.data?.availability
                ? "You are available to donate"
                : "You are unavailable"}
            </p>
            <p className="text-sm text-muted-foreground">
              When available, you&apos;ll appear in donor searches and be
              eligible for assignment.
            </p>
          </div>
          <AvailabilityToggle
            checked={Boolean(profileQuery.data?.availability)}
            disabled={profileQuery.isLoading || availabilityMutation.isPending}
            onChange={(next) =>
              availabilityMutation.mutate({ availability: next })
            }
          />
        </CardContent>
      </Card>

      {profileQuery.isLoading ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64" />
            <Skeleton className="h-9 w-40" />
          </CardContent>
        </Card>
      ) : profileQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <ProfileStat
              label="Blood group"
              value={BLOOD_GROUP_LABELS[profileQuery.data.bloodGroup]}
            />
            <ProfileStat
              label="Location"
              value={profileQuery.data.location}
            />
            <ProfileStat
              label="Weight"
              value={`${profileQuery.data.weightKg} kg`}
            />
            <ProfileStat
              label="Age"
              value={`${profileQuery.data.ageYears} years`}
            />
          </CardContent>
          <CardContent className="grid grid-cols-1 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <ProfileStat
              label="Total donations"
              value={String(profileQuery.data.totalDonations ?? 0)}
            />
            <ProfileStat
              label="Last donation"
              value={
                profileQuery.data.lastDonationAt
                  ? formatRelativeTime(profileQuery.data.lastDonationAt)
                  : "Never"
              }
            />
            <ProfileStat
              label="Eligibility"
              value={
                isEligible(profileQuery.data.lastDonationAt) ? (
                  <Badge variant="success">Eligible</Badge>
                ) : (
                  <Badge variant="warning">Cooling down</Badge>
                )
              }
            />
          </CardContent>
          <CardContent className="border-t border-border pt-4">
            <Link
              href="/donor/profile"
              className="text-sm font-medium text-primary hover:underline"
            >
              Edit profile →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<HeartPulseIcon size={22} />}
          title="Complete your donor profile"
          description="Tell us your blood group, location, and eligibility so we can match you with requests."
          action={
            <Link
              href="/donor/profile"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
            >
              Create your profile
            </Link>
          }
        />
      )}

      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Your assignments
          </h2>
        </header>
        {compatibleQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-9 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : compatibleQuery.isError ? (
          <p className="text-sm text-destructive">
            {toApiError(compatibleQuery.error).message}
          </p>
        ) : assignments.length === 0 ? (
          <EmptyState
            title="No active assignments"
            description="When an admin assigns you to a request, the case will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {assignments.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent compatible requests</CardTitle>
            <Link
              href="/donor/requests"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {compatibleQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : compatiblePreview.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No compatible requests at the moment. Check back soon.
              </p>
            ) : (
              <ul className="space-y-2">
                {compatiblePreview.map((req) => (
                  <li
                    key={req.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {req.patientName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {req.hospitalName} · {req.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">
                        {BLOOD_GROUP_LABELS[req.bloodGroup]}
                      </Badge>
                      <Badge
                        variant={
                          req.priority === "CRITICAL"
                            ? "destructive"
                            : req.priority === "HIGH"
                            ? "warning"
                            : req.priority === "MEDIUM"
                            ? "info"
                            : "default"
                        }
                      >
                        {PRIORITY_LABELS[req.priority as Priority]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent donations</CardTitle>
            <Link
              href="/donor/history"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {historyQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : historyQuery.isError ? (
              <p className="text-sm text-destructive">
                {toApiError(historyQuery.error).message}
              </p>
            ) : historyPreview.length === 0 ? (
              <EmptyState
                title="No donations yet"
                description="Your first donation will appear here after an assignment is completed."
                action={
                  <Link
                    href="/donor/requests"
                    className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    View compatible requests
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {historyPreview.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {entry.bloodRequest?.patientName ?? "Donation"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {entry.bloodRequest?.hospitalName ?? "—"} ·{" "}
                        {formatRelativeTime(entry.donationDate)}
                      </p>
                    </div>
                    <Badge variant="primary">
                      {entry.bloodRequest
                        ? BLOOD_GROUP_LABELS[entry.bloodRequest.bloodGroup]
                        : "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </PageContainer>
  );
}

/* ----------------------------------------------------------------------
   Availability toggle
   ---------------------------------------------------------------------- */
function AvailabilityToggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-success" : "bg-muted",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function ProfileStat({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Assignment card
   ---------------------------------------------------------------------- */
interface AssignmentLike {
  id: string;
  status: AssignmentStatus;
  assignedAt: string;
  bloodRequest: BloodRequest;
}

function AssignmentCard({ assignment }: { assignment: AssignmentLike }) {
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>
          <span className="inline-flex items-center gap-2">
            <DropletIcon size={14} /> {assignment.bloodRequest.patientName}
          </span>
        </CardTitle>
        <StatusBadge status={assignment.status} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="inline-flex items-center gap-1 text-muted-foreground">
          <MapPinIcon size={12} /> {assignment.bloodRequest.hospitalName} ·{" "}
          {assignment.bloodRequest.location}
        </p>
        <p className="text-xs text-muted-foreground">
          Assigned {formatRelativeTime(assignment.assignedAt)}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {assignment.status === "PENDING" ? (
            <>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await assignmentsApi.accept(assignment.id);
                    toast.success(
                      "Assignment accepted",
                      "The case is locked to you.",
                    );
                    void queryClient.invalidateQueries({
                      queryKey: ["donors", "requests"],
                    });
                    void queryClient.invalidateQueries({
                      queryKey: ["assignments", assignment.id],
                    });
                  } catch (error) {
                    toast.error(
                      "Failed to accept",
                      toApiError(error).message,
                    );
                  }
                }}
              >
                <CheckIcon size={12} /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setRejectOpen(true)}
              >
                <XCircleIcon size={12} /> Reject
              </Button>
            </>
          ) : null}
          {assignment.status === "ACCEPTED" ? (
            <Button size="sm" onClick={() => setCompleteOpen(true)}>
              <HeartPulseIcon size={12} /> Mark as Donated
            </Button>
          ) : null}
          {assignment.status === "COMPLETED" ? (
            <Badge variant="success">Completed</Badge>
          ) : null}
        </div>
      </CardContent>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        assignmentId={assignment.id}
        onRejected={() => {
          void queryClient.invalidateQueries({
            queryKey: ["donors", "requests"],
          });
        }}
      />
      <CompleteDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        assignmentId={assignment.id}
        onCompleted={() => {
          void queryClient.invalidateQueries({
            queryKey: ["donors", "requests"],
          });
          void queryClient.invalidateQueries({
            queryKey: ["donors", "donation-history"],
          });
        }}
      />
    </Card>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  assignmentId,
  onRejected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await assignmentsApi.reject(assignmentId, {
        reason: reason || undefined,
      });
      toast.success("Assignment rejected");
      onRejected();
      onOpenChange(false);
      setReason("");
    } catch (error) {
      toast.error("Failed to reject", toApiError(error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this assignment?</DialogTitle>
          <DialogDescription>
            The case will be released back to the admin pool and reassigned.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. unavailable due to travel"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={saving}
            >
              {saving ? "Rejecting…" : "Reject assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteDialog({
  open,
  onOpenChange,
  assignmentId,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  onCompleted: () => void;
}) {
  const [units, setUnits] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const n = Number(units);
    if (!Number.isFinite(n) || n < 1 || n > 2) {
      setError("Units must be 1 or 2.");
      return;
    }
    setSaving(true);
    try {
      await assignmentsApi.complete(assignmentId, {
        notes: notes || undefined,
        donationDate: new Date().toISOString(),
      });
      toast.success("Donation recorded", "Thank you for saving a life.");
      onCompleted();
      onOpenChange(false);
      setUnits("1");
      setNotes("");
    } catch (err) {
      toast.error("Failed to complete", toApiError(err).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as donated</DialogTitle>
          <DialogDescription>
            Record how many units were donated. The donation will appear in
            your history immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="complete-units">Units donated</Label>
            <Input
              id="complete-units"
              type="number"
              min={1}
              max={2}
              value={units}
              onChange={(event) => setUnits(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="complete-notes">Notes (optional)</Label>
            <Textarea
              id="complete-notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="e.g. smooth donation, no complications"
            />
          </div>
          {error ? (
            <p
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Mark donated"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function isActive(status: AssignmentStatus): boolean {
  return status === "PENDING" || status === "ACCEPTED";
}

function isEligible(lastDonationAt: string | null | undefined): boolean {
  if (!lastDonationAt) return true;
  const last = new Date(lastDonationAt).getTime();
  if (Number.isNaN(last)) return true;
  const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
  return days >= 90;
}
