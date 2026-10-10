/**
 * Application-wide TypeScript types.
 *
 * Mirrors PROJECT.md -> "Backend Integration > Enums" and the response
 * envelope documented in the same section. Every entity maps 1:1 to the
 * backend payload so API modules can return them directly.
 */

/* ----------------------------------------------------------------------
   Enums
   ---------------------------------------------------------------------- */

export type Role = "DONOR" | "REQUESTER" | "ADMIN";

export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RequestStatus =
  | "PENDING"
  | "VERIFIED"
  | "MATCHING"
  | "ASSIGNED"
  | "COMPLETED"
  | "CANCELLED";

export type AssignmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type UserStatus = "ACTIVE" | "BLOCKED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type PaymentPurpose =
  | "EMERGENCY_VERIFICATION_FEE"
  | "COORDINATION_FEE"
  | "LOGISTICS_FEE";

/* ----------------------------------------------------------------------
   API envelope
   ---------------------------------------------------------------------- */

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Array<{ path: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface ApiError {
  message: string;
  errors?: Array<{ path: string; message: string }>;
  status?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated list endpoints wrap their data as:
 *   { meta, result: T[] }
 * See PROJECT.md -> "Response Envelope".
 */
export interface PaginatedResult<T> {
  meta: PaginationMeta;
  result: T[];
}

/* ----------------------------------------------------------------------
   User
   ---------------------------------------------------------------------- */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  bloodGroup?: BloodGroup | null;
  avatarUrl?: string | null;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------------
   Donor
   ---------------------------------------------------------------------- */

export interface DonorProfile {
  id: string;
  userId: string;
  bloodGroup: BloodGroup;
  location: string;
  weightKg: number;
  ageYears: number;
  availability: boolean;
  totalDonations?: number;
  lastDonationAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------------
   Donor search result
   ----------------------------------------------------------------------
   Shape returned by `GET /donors/search`. The backend flattens the
   `DonorProfile` onto the `User` record so the result is the union of
   both. Defined here so the API layer can type the list endpoint.
   ---------------------------------------------------------------------- */
export interface DonorSearchResult {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: string;
  availability: boolean;
  totalDonations: number;
  lastDonationDate: string | null;
}

/* ----------------------------------------------------------------------
   Blood request
   ---------------------------------------------------------------------- */

export interface BloodRequest {
  id: string;
  requesterId: string;
  requester?: { id: string; name: string; email: string };

  patientName: string;
  bloodGroup: BloodGroup;
  /**
   * Number of units requested. NOTE: the backend's field is
   * `unitsNeeded`, not `units`. The wizard form keeps the form field
   * named `units` and maps it to this property at submit time.
   */
  unitsNeeded: number;
  priority: Priority;

  hospitalName: string;
  location: string;
  latitude: number | null;
  longitude: number | null;

  /**
   * Target date/time by which the blood is needed. Backend field is
   * `neededBy` (not `neededAt`). Nullable — the backend may leave it
   * `null` if the requester did not provide a value.
   */
  neededBy: string | null;

  contactPhone: string;
  notes: string | null;

  status: RequestStatus;
  verifiedById: string | null;
  verifiedAt: string | null;
  verifiedBy?: { id: string; name: string } | null;
  assignments?: unknown[];

  /** Soft-delete timestamp. `null` for active records. */
  deletedAt: string | null;

  assignment?: DonationAssignment | null;

  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------------
   Assignment
   ---------------------------------------------------------------------- */

export interface DonationAssignment {
  id: string;
  bloodRequestId: string;
  donorId: string;
  donor?: Pick<User, "id" | "name" | "email" | "phone" | "bloodGroup">;
  bloodRequest?: Pick<BloodRequest, "id" | "patientName" | "bloodGroup">;

  status: AssignmentStatus;
  assignedAt: string;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------------
   Donation history
   ---------------------------------------------------------------------- */

export interface DonationHistory {
  id: string;
  donorId: string;
  donor?: Pick<User, "id" | "name" | "email" | "bloodGroup">;
  bloodRequestId: string;
  bloodRequest?: Pick<
    BloodRequest,
    "id" | "patientName" | "bloodGroup" | "hospitalName" | "location"
  >;
  donationDate: string;
  units: number;
  location?: string | null;
  certificateUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------------
   Payment
   ---------------------------------------------------------------------- */

export interface Payment {
  id: string;
  userId: string;
  user?: Pick<User, "id" | "name" | "email" | "phone">;
  bloodRequestId?: string | null;
  bloodRequest?: Pick<BloodRequest, "id" | "patientName"> | null;
  purpose: PaymentPurpose;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string | null;
  gatewayPageURL?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ----------------------------------------------------------------------
   Audit log
   ---------------------------------------------------------------------- */

export interface AuditLog {
  id: string;
  actorId: string;
  actor?: Pick<User, "id" | "name" | "email" | "role">;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

/* ----------------------------------------------------------------------
   Admin dashboard stats
   ----------------------------------------------------------------------
   Shape returned by `GET /admin/dashboard-stats`. The backend ships
   a flat record of headline counts and a `generatedAt` timestamp; it
   does NOT return any of the breakdown objects or recent lists that
   the previous spec assumed. Those data are still available via
   dedicated endpoints (see recentRequests / recentActivity in the
   admin page) and should be fetched with separate queries.
   ---------------------------------------------------------------------- */

export type RequestStatusBreakdown = Record<RequestStatus, number>;
export type BloodGroupBreakdown = Record<BloodGroup, number>;
export type RoleBreakdown = Record<Role, number>;

export interface AdminDashboardStats {
  totalUsers: number;
  totalDonors: number;
  totalRequesters: number;
  totalBloodRequests: number;
  pendingRequests: number;
  completedRequests: number;
  totalDonations: number;
  totalPayments: number;
  totalRevenue: number;
  generatedAt: string;
}
