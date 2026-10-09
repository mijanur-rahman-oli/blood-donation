/**
 * Project-wide constants.
 *
 * Enum value strings mirror the backend exactly. They are sourced from
 * PROJECT.md -> "Backend Integration > Enums" and the locked design system.
 */

/* ----------------------------------------------------------------------
   Roles
   ---------------------------------------------------------------------- */
export const ROLES = ["DONOR", "REQUESTER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  DONOR: "Donor",
  REQUESTER: "Requester",
  ADMIN: "Admin",
};

export const ROLE_HOME: Record<Role, string> = {
  DONOR: "/donor",
  REQUESTER: "/dashboard",
  ADMIN: "/admin",
};

/* ----------------------------------------------------------------------
   Blood groups
   ---------------------------------------------------------------------- */
export const BLOOD_GROUPS = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A−",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B−",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB−",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O−",
};

/** UI-friendly color token used by badges and the compatibility chart. */
export const BLOOD_GROUP_COLORS: Record<BloodGroup, string> = {
  A_POSITIVE: "bg-red-100 text-red-700 border-red-200",
  A_NEGATIVE: "bg-red-200 text-red-800 border-red-300",
  B_POSITIVE: "bg-blue-100 text-blue-700 border-blue-200",
  B_NEGATIVE: "bg-blue-200 text-blue-800 border-blue-300",
  AB_POSITIVE: "bg-purple-100 text-purple-700 border-purple-200",
  AB_NEGATIVE: "bg-purple-200 text-purple-800 border-purple-300",
  O_POSITIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  O_NEGATIVE: "bg-emerald-200 text-emerald-800 border-emerald-300",
};

/* ----------------------------------------------------------------------
   Request priority
   ---------------------------------------------------------------------- */
export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-info/10 text-info border-info/20",
  HIGH: "bg-warning/10 text-warning border-warning/20",
  CRITICAL: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ----------------------------------------------------------------------
   Blood-request status
   ---------------------------------------------------------------------- */
export const REQUEST_STATUSES = [
  "PENDING",
  "VERIFIED",
  "MATCHING",
  "ASSIGNED",
  "COMPLETED",
  "CANCELLED",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  MATCHING: "Matching",
  ASSIGNED: "Assigned",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const REQUEST_STATUS_STYLES: Record<RequestStatus, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  VERIFIED: "bg-info/10 text-info border-info/20",
  MATCHING: "bg-info/10 text-info border-info/20",
  ASSIGNED: "bg-info/10 text-info border-info/20",
  COMPLETED: "bg-success/10 text-success border-success/20",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ----------------------------------------------------------------------
   Assignment status
   ---------------------------------------------------------------------- */
export const ASSIGNMENT_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const ASSIGNMENT_STATUS_STYLES: Record<AssignmentStatus, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  ACCEPTED: "bg-info/10 text-info border-info/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
  COMPLETED: "bg-success/10 text-success border-success/20",
};

/* ----------------------------------------------------------------------
   User status
   ---------------------------------------------------------------------- */
export const USER_STATUSES = ["ACTIVE", "BLOCKED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  BLOCKED: "Blocked",
};

export const USER_STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: "bg-success/10 text-success border-success/20",
  BLOCKED: "bg-destructive/10 text-destructive border-destructive/20",
};

/* ----------------------------------------------------------------------
   Payment status + purpose
   ---------------------------------------------------------------------- */
export const PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "CANCELLED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-warning/10 text-warning border-warning/20",
  PAID: "bg-success/10 text-success border-success/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

export const PAYMENT_PURPOSES = [
  "EMERGENCY_VERIFICATION_FEE",
  "COORDINATION_FEE",
  "LOGISTICS_FEE",
] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_PURPOSE_LABELS: Record<PaymentPurpose, string> = {
  EMERGENCY_VERIFICATION_FEE: "Emergency Verification Fee",
  COORDINATION_FEE: "Coordination Fee",
  LOGISTICS_FEE: "Logistics Fee",
};

/* ----------------------------------------------------------------------
   Demo accounts (one-click login buttons)
   ----------------------------------------------------------------------
   Mirrors PROJECT.md -> "Authentication & Authorization > Demo Accounts".
   ---------------------------------------------------------------------- */
export interface DemoAccount {
  role: Role;
  email: string;
  password: string;
  redirect: string;
  label: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    role: "ADMIN",
    email: "admin@blooddonation.com",
    password: "Admin@12345",
    redirect: "/admin",
    label: "Login as Admin",
  },
  {
    role: "REQUESTER",
    email: "requester@example.com",
    password: "Requester@12345",
    redirect: "/dashboard",
    label: "Login as Requester",
  },
  {
    role: "DONOR",
    email: "karim.donor@example.com",
    password: "Donor@12345",
    redirect: "/donor",
    label: "Login as Donor",
  },
] as const;

/* ----------------------------------------------------------------------
   Pagination + filter defaults
   ---------------------------------------------------------------------- */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const PAGE_LIMIT_OPTIONS = [10, 20, 50, 100] as const;

/* ----------------------------------------------------------------------
   Validation bounds
   ---------------------------------------------------------------------- */
export const DONOR_MIN_AGE = 18;
export const DONOR_MAX_AGE = 65;
export const DONOR_MIN_WEIGHT_KG = 45;
export const DONOR_MAX_WEIGHT_KG = 200;

export const VERIFICATION_FEE_AMOUNT = 200; // BDT
export const COORDINATION_FEE_AMOUNT = 300; // BDT
export const LOGISTICS_FEE_AMOUNT = 500; // BDT

/* ----------------------------------------------------------------------
   App metadata
   ---------------------------------------------------------------------- */
export const APP_NAME = "Blood Donation Platform";
export const APP_DESCRIPTION =
  "Connect donors, requesters, and admins on a fast, verified blood-donation platform.";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
