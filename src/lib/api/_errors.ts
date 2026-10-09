import axios, { AxiosError } from "axios";

import type { ApiError, ApiResponse } from "@/types";

/**
 * Custom error class thrown by every API helper when the backend returns
 * `success: false` or a non-2xx HTTP status. Carries the backend's
 * `message`, the per-field `errors[]`, and the HTTP `status`.
 */
export class ApiCallError extends Error {
  public readonly status: number;
  public readonly errors: Array<{ path: string; message: string }>;

  constructor(message: string, status = 0, errors: ApiError["errors"] = []) {
    super(message);
    this.name = "ApiCallError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Unwrap a backend `ApiResponse<T>` (envelope) into its `data` field, or
 * throw an `ApiCallError` if the envelope signals failure.
 *
 * All API helpers route their axios responses through this function so
 * the throwing contract is uniform across the entire surface.
 */
export function unwrap<T>(response: { data: ApiResponse<T> }): T {
  const body = response.data;
  if (body && body.success === true) {
    return body.data;
  }
  throw new ApiCallError(
    body?.message ?? "Request failed",
    response.status,
    body?.errors ?? [],
  );
}

/**
 * Unwrap a list endpoint. Backend wraps list data as
 *   { success: true, data: { meta, result: T[] } }
 * so this helper narrows the inner shape and returns just the
 * `PaginatedResult<T>`.
 */
export function unwrapList<T>(response: {
  data: ApiResponse<{ meta: import("@/types").PaginationMeta; result: T[] }>;
}): import("@/types").PaginatedResult<T> {
  return unwrap(response);
}

/**
 * Unwrap a plain object endpoint that returns `data: T` directly. Provided
 * for clarity at the call site; equivalent to `unwrap` when T is non-list.
 */
export function unwrapData<T>(response: { data: ApiResponse<T> }): T {
  return unwrap(response);
}

/**
 * Translate an arbitrary thrown value (typically an `AxiosError`) into an
 * `ApiCallError`. Preserves the backend's per-field `errors` array.
 */
export function toApiError(error: unknown, fallback = "Request failed"): ApiCallError {
  if (error instanceof ApiCallError) return error;
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{
      success?: false;
      message?: string;
      errors?: Array<{ path: string; message: string }>;
    }>;
    const data = ax.response?.data;
    return new ApiCallError(
      data?.message ?? ax.message ?? fallback,
      ax.response?.status ?? 0,
      data?.errors ?? [],
    );
  }
  if (error instanceof Error) return new ApiCallError(error.message, 0, []);
  return new ApiCallError(fallback, 0, []);
}
