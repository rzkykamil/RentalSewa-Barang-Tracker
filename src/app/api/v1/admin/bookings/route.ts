import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { authOptions } from "@/modules/auth/auth-options";
import { listBookingsForAdmin } from "@/modules/admin/admin.service";

const BOOKING_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "LATE"] as const;

const listBookingsQuerySchema = z.object({
  status: z.enum(BOOKING_STATUS_VALUES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * `GET /api/v1/admin/bookings` — full booking listing for monitoring
 * (not scoped to any user), Admin-only. Filter `status` optional,
 * pagination `page`/`limit`.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Hanya Admin yang dapat mengakses daftar booking.");
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listBookingsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const { status, page, limit } = parsed.data;
    const result = await listBookingsForAdmin({ status, page, limit });
    return apiSuccess(result.bookings, { meta: { pagination: result.pagination } });
  } catch (error) {
    logError("api.unhandled_error", error, { route: "GET /api/v1/admin/bookings" });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
