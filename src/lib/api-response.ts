import { NextResponse } from "next/server";

/**
 * Shared API response envelope helpers, enforcing the two response shapes
 * mandated by `.claude/rules/api-design.md` / `docs/api-spec.md` §1:
 *
 *   success: { data, meta? }
 *   error:   { error: { code, message, details? } }
 *
 * Route handlers under `src/app/api/v1/**` should format all responses
 * through these helpers instead of building ad-hoc `NextResponse.json` shapes.
 */

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_RULE_VIOLATION"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

/** HTTP status conventionally paired with each error code, per docs/api-spec.md §2. */
export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export function apiSuccess<T>(
  data: T,
  options?: { status?: number; meta?: Record<string, unknown> }
) {
  return NextResponse.json(
    { data, ...(options?.meta !== undefined ? { meta: options.meta } : {}) },
    { status: options?.status ?? 200 }
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  options?: { status?: number; details?: unknown }
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(options?.details !== undefined ? { details: options.details } : {}),
      },
    },
    { status: options?.status ?? API_ERROR_STATUS[code] }
  );
}
