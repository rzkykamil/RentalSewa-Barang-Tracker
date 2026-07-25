import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { authOptions } from "@/modules/auth/auth-options";
import { listHistoryForUser } from "@/modules/bookings/bookings.service";

const BOOKING_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "LATE"] as const;

const historyQuerySchema = z.object({
  status: z.enum(BOOKING_STATUS_VALUES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * `GET /api/v1/history/me`
 * Returns current user booking history as Owner and/or Renter, sorted by newest activity.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }

  if (session.user.role !== "OWNER" && session.user.role !== "RENTER") {
    return apiError("FORBIDDEN", "Endpoint ini hanya untuk Renter atau Owner.");
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = historyQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  const { status, page, limit } = parsed.data;

  try {
    const result = await listHistoryForUser(session.user.id, { status, page, limit });
    return apiSuccess(result.bookings, { meta: { pagination: result.pagination } });
  } catch (error) {
    logError("api.unhandled_error", error, { route: "GET /api/v1/history/me" });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
