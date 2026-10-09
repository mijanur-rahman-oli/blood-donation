"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Select,
  Skeleton,
  Textarea,
} from "@/components/admin/primitives";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import * as bloodRequestsApi from "@/lib/api/bloodRequests";
import * as paymentsApi from "@/lib/api/payments";
import { extractApiError } from "@/lib/api/_errors";
import {
  BLOOD_GROUP_LABELS,
  PRIORITIES,
  PRIORITY_LABELS,
  VERIFICATION_FEE_AMOUNT,
} from "@/lib/constants";
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatRelativeTime,
} from "@/lib/utils";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckIcon,
  CreditCardIcon,
  DropletIcon,
} from "@/components/dashboard/icons";
import { toast } from "@/app/providers";
import type { BloodRequest, Priority, RequestStatus } from "@/types";

/* ----------------------------------------------------------------------
   RequestDetail
   ----------------------------------------------------------------------
   Two-column layout. Mutation: cancel (optimistic), edit (pessimistic
   with the inline Edit dialog). Pay button is gated on
   user.role === "REQUESTER" so admins/donors never see it.
   ---------------------------------------------------------------------- */

const TIMELINE_STEPS: ReadonlyArray<{ key: RequestStatus; label: string }> = [
  { key: "PENDING", label: "Submitted" },
  { key: "VERIFIED", label: "Verified" },
  { key: "MATCHING", label: "Matching" },
  { key: "ASSIGNED", label: "Assigned" },
  { key: "COMPLETED", label: "Completed" },
];

export default function RequestDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const query = useQuery<BloodRequest, Error>({
    queryKey: ["blood-requests", id],
    queryFn: () => bloodRequestsApi.getById(id),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      units?: number;
      notes?: string;
      priority?: Priority;
    }) => bloodRequestsApi.update(id, input),
    onSuccess: () => {
      toast.success("Request updated");
      void queryClient.invalidateQueries({ queryKey: ["blood-requests", id] });
      void queryClient.invalidateQueries({ queryKey: ["blood-requests"] });
      setEditOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update", extractApiError(error));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => bloodRequestsApi.cancel(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["blood-requests", id] });
      const previous = queryClient.getQueryData<BloodRequest | undefined>([
        "blood-requests",
        id,
      ]);
      if (previous) {
        queryClient.setQueryData<BloodRequest>(
          ["blood-requests", id],
          (prev) =>
            prev
              ? { ...prev, status: "CANCELLED", updatedAt: new Date().toISOString() }
              : prev,
        );
      }
      return { previous };
    },
    onSuccess: () => {
      toast.success("Request cancelled", "The case has been marked CANCELLED.");
      void queryClient.invalidateQueries({ queryKey: ["blood-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["blood-requests", id] });
      router.push("/dashboard");
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["blood-requests", id], context.previous);
      }
      toast.error("Failed to cancel", extractApiError(error));
    },
  });

  async function handlePay() {
    if (!query.data || !user) return;
    setPaying(true);
    try {
      const res = await paymentsApi.initiate({
        bloodRequestId: query.data.id,
        purpose: "EMERGENCY_VERIFICATION_FEE",
        amount: VERIFICATION_FEE_AMOUNT,
        customerName: user.name,
        customerPhone: query.data.contactPhone,
      });
      if (res.gatewayPageURL) {
        window.location.href = res.gatewayPageURL;
      } else {
        throw new Error("Payment gateway did not return a redirect URL");
      }
    } catch (error) {
      toast.error("Failed to start payment", extractApiError(error));
      setPaying(false);
    }
  }

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <EmptyState
        title="Request not found"
        description={query.error?.message ?? "We could not load this request."}
        action={
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
          >
            Back to dashboard
          </Link>
        }
      />
    );
  }

  const request = query.data;
  const isRequester = user?.role === "REQUESTER";
  const activeIndex = TIMELINE_STEPS.findIndex((s) => s.key === request.status);
  const isCancelled = request.status === "CANCELLED";
  const canPay =
    isRequester &&
    (request.status === "PENDING" || request.status === "VERIFIED");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon size={14} /> Back
        </Link>
      </div>

      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {request.patientName}
            </h1>
            <StatusBadge status={request.status} />
            <Badge variant={priorityBadgeVariant(request.priority)}>
              {PRIORITY_LABELS[request.priority]}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Created {formatRelativeTime(request.createdAt)} ·{" "}
            <span title={formatDateTime(request.createdAt)}>
              {formatDate(request.createdAt)}
            </span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Patient information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Info label="Patient" value={request.patientName} />
              <Info
                label="Blood group"
                value={
                  <Badge variant="primary">
                    {BLOOD_GROUP_LABELS[request.bloodGroup]}
                  </Badge>
                }
              />
              <Info
                label="Units"
                value={`${request.units} unit${request.units === 1 ? "" : "s"}`}
              />
              <Info label="Contact phone" value={request.contactPhone} />
              <Info
                label="Contact name"
                value={request.contactName}
                className="sm:col-span-2"
              />
              {request.notes ? (
                <Info
                  label="Notes"
                  value={
                    <span className="whitespace-pre-wrap">{request.notes}</span>
                  }
                  className="sm:col-span-2"
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hospital</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Info label="Hospital" value={request.hospitalName} />
              <Info label="Location" value={request.location} />
              <Info
                label="Priority"
                value={
                  <Badge variant={priorityBadgeVariant(request.priority)}>
                    {PRIORITY_LABELS[request.priority]}
                  </Badge>
                }
              />
              <Info
                label="Needed by"
                value={
                  <span title={formatDateTime(request.neededAt)}>
                    {formatDateTime(request.neededAt)}
                  </span>
                }
              />
            </CardContent>
          </Card>

          {request.assignment ? (
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <Info
                  label="Donor"
                  value={request.assignment.donor?.name ?? "Assigned donor"}
                />
                <Info
                  label="Contact"
                  value={request.assignment.donor?.phone ?? "—"}
                />
                <Info
                  label="Status"
                  value={<StatusBadge status={request.assignment.status} />}
                />
                <Info
                  label="Assigned at"
                  value={
                    <span
                      title={formatDateTime(request.assignment.assignedAt)}
                    >
                      {formatDateTime(request.assignment.assignedAt)}
                    </span>
                  }
                />
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {TIMELINE_STEPS.map((step, idx) => {
                  const done = !isCancelled && activeIndex >= idx;
                  const current = !isCancelled && activeIndex === idx;
                  return (
                    <li key={step.key} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full " +
                          (isCancelled
                            ? "bg-muted text-muted-foreground"
                            : done
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground")
                        }
                      >
                        {done ? (
                          <CheckIcon size={12} />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </span>
                      <div className="flex-1">
                        <p
                          className={
                            "text-sm font-semibold " +
                            (done || current
                              ? "text-foreground"
                              : "text-muted-foreground")
                          }
                        >
                          {step.label}
                        </p>
                        {current ? (
                          <p className="text-xs text-muted-foreground">
                            In progress
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
                {isCancelled ? (
                  <li className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <AlertTriangleIcon size={12} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Cancelled
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This case was cancelled.
                      </p>
                    </div>
                  </li>
                ) : null}
              </ol>
            </CardContent>
          </Card>

          {canPay ? (
            <Card>
              <CardHeader>
                <CardTitle>Verification fee</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Pay the emergency coordination fee to prioritise your request
                  and unlock faster donor contact.
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(VERIFICATION_FEE_AMOUNT)}
                </p>
                <Button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full"
                >
                  <CreditCardIcon size={16} />
                  {paying ? "Redirecting…" : "Pay Now"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You will be redirected to the SSLCommerz sandbox gateway.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {isRequester && request.status === "PENDING" ? (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditOpen(true)}
                  disabled={updateMutation.isPending}
                >
                  Edit request
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelOpen(true)}
                  disabled={cancelMutation.isPending}
                >
                  Cancel request
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        request={request}
        onSave={(values) => updateMutation.mutate(values)}
        saving={updateMutation.isPending}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this request?</DialogTitle>
            <DialogDescription>
              The case will be marked as CANCELLED. This action cannot be
              undone — you will need to create a new request if the patient
              still needs blood.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep request
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling…" : "Cancel request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Edit dialog
   ---------------------------------------------------------------------- */
function EditDialog({
  open,
  onOpenChange,
  request,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: BloodRequest;
  onSave: (input: {
    units?: number;
    notes?: string;
    priority?: Priority;
  }) => void;
  saving: boolean;
}) {
  const [units, setUnits] = useState(String(request.units));
  const [notes, setNotes] = useState(request.notes ?? "");
  const [priority, setPriority] = useState<Priority>(request.priority);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const n = Number(units);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      setError("Units must be a whole number between 1 and 10.");
      return;
    }
    setError(null);
    onSave({ units: n, notes: notes || undefined, priority });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit request</DialogTitle>
          <DialogDescription>
            You can change the units, notes, and priority. Other fields are
            fixed once the case is submitted.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="edit-units">Units</Label>
            <Input
              id="edit-units"
              type="number"
              min={1}
              max={10}
              value={units}
              onChange={(event) => setUnits(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select
              id="edit-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as Priority)}
              options={PRIORITIES.map((p) => ({ value: p, label: p }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
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
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Info({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
    </div>
  );
}

function priorityBadgeVariant(
  priority: Priority,
): "destructive" | "warning" | "info" | "default" {
  switch (priority) {
    case "CRITICAL":
      return "destructive";
    case "HIGH":
      return "warning";
    case "MEDIUM":
      return "info";
    case "LOW":
    default:
      return "default";
  }
}
