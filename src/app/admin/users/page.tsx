"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge, Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, RadioGroup, Select } from "@/components/admin/primitives";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { SearchInput } from "@/components/shared/SearchInput";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MoreHorizontalIcon } from "@/components/admin/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/primitives";
import * as adminApi from "@/lib/api/admin";
import { extractApiError } from "@/lib/api/_errors";
import { ROLE_LABELS, ROLES } from "@/lib/constants";
import { useUpdateSearchParams } from "@/hooks/useUpdateSearchParams";
import { formatDate } from "@/lib/utils";
import { toast } from "@/app/providers";
import type { PaginatedResult, Role, User, UserStatus } from "@/types";

/* ----------------------------------------------------------------------
   /admin/users — User management
   ----------------------------------------------------------------------
   URL-synced filters: ?page&limit&role&status&q. TanStack Query with
   `keepPreviousData` so navigating between pages does not flash a
   loading skeleton. Mutations for role and status change invalidate
   the `["admin", "users", filters]` key on success.
   ---------------------------------------------------------------------- */

interface UsersFilters {
  page: number;
  limit: number;
  role?: Role;
  status?: UserStatus;
  q?: string;
}

const ROLE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All roles" },
  ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
];

const STATUS_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "BLOCKED", label: "Blocked" },
];

export default function AdminUsersPage() {
  const { searchParams, update, remove } = useUpdateSearchParams();

  const filters = useMemo<UsersFilters>(() => {
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    return {
      page: Number(searchParams.get("page") ?? 1) || 1,
      limit: Number(searchParams.get("limit") ?? 10) || 10,
      role: isRole(role) ? role : undefined,
      status: isUserStatus(status) ? status : undefined,
      q: q ?? undefined,
    };
  }, [searchParams]);

  const query = useQuery<PaginatedResult<User>, Error>({
    queryKey: ["admin", "users", filters],
    queryFn: () =>
      adminApi.listUsers({
        page: filters.page,
        limit: filters.limit,
        role: filters.role,
        status: filters.status,
        q: filters.q,
      }),
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const queryClient = useQueryClient();

  const roleMutation = useMutation({
    mutationFn: (input: { id: string; role: Role }) =>
      adminApi.updateUserRole(input.id, { role: input.role }),
    onSuccess: () => {
      toast.success("Role updated", "The user's role has been changed.");
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      toast.error("Failed to update role", extractApiError(error));
    },
  });

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: UserStatus }) =>
      adminApi.updateUserStatus(input.id, { status: input.status }),
    onSuccess: (user) => {
      toast.success(
        user.status === "BLOCKED" ? "User blocked" : "User unblocked",
        "The user's status has been updated.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      toast.error("Failed to update status", extractApiError(error));
    },
  });

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        accessor: "name",
        header: "User",
        cell: (row) => (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
            >
              {initials(row.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {row.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">{row.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessor: "role",
        header: "Role",
        cell: (row) => (
          <Badge variant={roleBadgeVariant(row.role)}>{ROLE_LABELS[row.role]}</Badge>
        ),
      },
      {
        accessor: "status",
        header: "Status",
        cell: (row) => <StatusBadge status={row.status} />,
      },
      {
        accessor: "createdAt",
        header: "Joined",
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        accessor: "id",
        header: "Actions",
        sortable: false,
        align: "right",
        cell: (row) => (
          <RowActions
            user={row}
            onChangeRole={(role) => roleMutation.mutate({ id: row.id, role })}
            onChangeStatus={(status) => statusMutation.mutate({ id: row.id, status })}
            rolePending={roleMutation.isPending && roleMutation.variables?.id === row.id}
            statusPending={statusMutation.isPending && statusMutation.variables?.id === row.id}
          />
        ),
      },
    ],
    [roleMutation, statusMutation],
  );

  const hasFilters =
    Boolean(filters.role) || Boolean(filters.status) || Boolean(filters.q);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage platform users</p>
      </header>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput placeholder="Search by name or email…" />
          <Select
            value={filters.role ?? "ALL"}
            onChange={(event) =>
              update({
                role: event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={ROLE_FILTER_OPTIONS}
            aria-label="Role filter"
          />
          <Select
            value={filters.status ?? "ALL"}
            onChange={(event) =>
              update({
                status: event.target.value === "ALL" ? null : event.target.value,
                page: 1,
              })
            }
            options={STATUS_FILTER_OPTIONS}
            aria-label="Status filter"
          />
          <div className="flex items-center justify-end">
            {hasFilters ? (
              <Button
                variant="outline"
                onClick={() =>
                  remove(["q", "role", "status", "page", "limit"])
                }
              >
                Clear filters
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">No filters applied</span>
            )}
          </div>
        </CardContent>
      </Card>

      {query.isError ? (
        <EmptyState
          title="Failed to load users"
          description={query.error?.message ?? "Please try again."}
          action={
            <Button onClick={() => query.refetch()}>Retry</Button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={query.data?.result ?? []}
            isLoading={query.isLoading}
            rowKey={(row) => row.id}
            emptyState={
              <EmptyState
                className="border-0"
                title="No users found"
                description={
                  hasFilters
                    ? "Try removing some filters or adjusting your search."
                    : "Users will appear here as they sign up."
                }
              />
            }
          />
          <Pagination
            total={query.data?.meta.total ?? 0}
            totalPages={query.data?.meta.totalPages ?? 1}
          />
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   Row actions
   ---------------------------------------------------------------------- */
interface RowActionsProps {
  user: User;
  onChangeRole: (role: Role) => void;
  onChangeStatus: (status: UserStatus) => void;
  rolePending: boolean;
  statusPending: boolean;
}

function RowActions({
  user,
  onChangeRole,
  onChangeStatus,
  rolePending,
  statusPending,
}: RowActionsProps) {
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [roleValue, setRoleValue] = useState<Role>(user.role);

  return (
    <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Open user actions"
        >
          <MoreHorizontalIcon size={16} />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => { setRoleValue(user.role); setRoleOpen(true); }}>
            Change role
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setStatusOpen(true)}
            className={user.status === "BLOCKED" ? "" : "text-destructive"}
          >
            {user.status === "BLOCKED" ? "Unblock user" : "Block user"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Change role dialog */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change role for {user.name}</DialogTitle>
            <DialogDescription>
              Pick the new role. The change takes effect on the user's next
              page load.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5">
            <Label className="mb-2 block">Role</Label>
            <RadioGroup
              value={roleValue}
              onValueChange={(v) => setRoleValue(v as Role)}
              options={ROLES.map((r) => ({
                value: r,
                label: ROLE_LABELS[r],
                description:
                  r === "ADMIN"
                    ? "Platform operator with full access"
                    : r === "DONOR"
                    ? "Can accept and complete donations"
                    : "Can post and pay for blood requests",
              }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onChangeRole(roleValue);
                setRoleOpen(false);
              }}
              disabled={rolePending || roleValue === user.role}
            >
              {rolePending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status confirmation dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {user.status === "BLOCKED" ? "Unblock" : "Block"} {user.name}?
            </DialogTitle>
            <DialogDescription>
              {user.status === "BLOCKED"
                ? "The user will regain access to the platform immediately."
                : "Blocked users cannot log in until they are unblocked."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={user.status === "BLOCKED" ? "default" : "destructive"}
              onClick={() => {
                onChangeStatus(user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED");
                setStatusOpen(false);
              }}
              disabled={statusPending}
            >
              {statusPending
                ? "Saving…"
                : user.status === "BLOCKED"
                ? "Unblock user"
                : "Block user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------------- */
function roleBadgeVariant(role: Role): "info" | "destructive" | "primary" {
  switch (role) {
    case "ADMIN":
      return "destructive";
    case "DONOR":
      return "info";
    case "REQUESTER":
    default:
      return "primary";
  }
}

function initials(name: string): string {
  if (!name) return "?";
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function isRole(value: string | null): value is Role {
  return value === "DONOR" || value === "REQUESTER" || value === "ADMIN";
}

function isUserStatus(value: string | null): value is UserStatus {
  return value === "ACTIVE" || value === "BLOCKED";
}
