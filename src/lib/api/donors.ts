import { api } from "@/lib/axios";
import type {
  ApiResponse,
  BloodGroup,
  BloodRequest,
  DonorProfile,
  PaginatedResult,
  User,
} from "@/types";

import { unwrapData, unwrapList } from "./_errors";

/* ----------------------------------------------------------------------
   Donors
   ----------------------------------------------------------------------
   Endpoints from PROJECT.md -> "Backend Integration > Donors".
   ---------------------------------------------------------------------- */

export interface CreateDonorProfileInput {
  bloodGroup: BloodGroup;
  location: string;
  weightKg: number;
  ageYears: number;
}

export interface UpdateDonorProfileInput {
  bloodGroup?: BloodGroup;
  location?: string;
  weightKg?: number;
  ageYears?: number;
  availability?: boolean;
}

export interface UpdateAvailabilityInput {
  availability: boolean;
}

export interface SearchDonorsParams {
  bloodGroup?: BloodGroup;
  availability?: boolean;
  location?: string;
  q?: string;
  page?: number;
  limit?: number;
}

/**
 * `GET /donors/search` is Admin/Requester-only and returns the donor
 * objects shaped like `User` enriched with their donor profile fields.
 */
export interface DonorSearchResult extends User {
  bloodGroup: BloodGroup;
  location: string;
  availability: boolean;
  totalDonations?: number;
  lastDonationAt?: string | null;
}

export async function createProfile(
  payload: CreateDonorProfileInput,
): Promise<DonorProfile> {
  const res = await api.post<ApiResponse<DonorProfile>>(
    "/donors/profile",
    payload,
  );
  return unwrapData(res);
}

export async function getMyProfile(): Promise<DonorProfile> {
  const res = await api.get<ApiResponse<DonorProfile>>("/donors/profile");
  return unwrapData(res);
}

export async function updateProfile(
  payload: UpdateDonorProfileInput,
): Promise<DonorProfile> {
  const res = await api.patch<ApiResponse<DonorProfile>>(
    "/donors/profile",
    payload,
  );
  return unwrapData(res);
}

export async function updateAvailability(
  payload: UpdateAvailabilityInput,
): Promise<DonorProfile> {
  const res = await api.patch<ApiResponse<DonorProfile>>(
    "/donors/availability",
    payload,
  );
  return unwrapData(res);
}

export async function getCompatibleRequests(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<BloodRequest>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<BloodRequest>>
  >("/donors/requests", { params });
  return unwrapList(res);
}

export async function getDonationHistory(
  params: { page?: number; limit?: number } = {},
): Promise<PaginatedResult<BloodRequest>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<BloodRequest>>
  >("/donors/donation-history", { params });
  return unwrapList(res);
}

export async function searchDonors(
  params: SearchDonorsParams,
): Promise<PaginatedResult<DonorSearchResult>> {
  const res = await api.get<
    ApiResponse<PaginatedResult<DonorSearchResult>>
  >("/donors/search", { params });
  return unwrapList(res);
}
