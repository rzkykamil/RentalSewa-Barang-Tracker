import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { authOptions } from "@/modules/auth/auth-options";
import {
  BookingAccessError,
  ItemNotFoundError,
  listBookingsForItem,
} from "@/modules/bookings/bookings.service";

const BOOKING_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "LATE"] as const;

const itemBookingsQuerySchema = z.object({
  status: z.enum(BOOKING_STATUS_VALUES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * `GET /api/v1/items/:id/bookings`
 * Returns bookings for an item owned by current Owner.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Hanya Owner atau Admin yang dapat melihat booking item.");
  }

  const { id } = await params;
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = itemBookingsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const { status, page, limit } = parsed.data;
    const result = await listBookingsForItem(id, session.user.id, session.user.role, { status, page, limit });
    return apiSuccess(result.bookings, { meta: { pagination: result.pagination } });
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return apiError("NOT_FOUND", "Barang tidak ditemukan.");
    }
    if (error instanceof BookingAccessError) {
      return apiError("FORBIDDEN", "Anda tidak memiliki akses ke booking item ini.");
    }
    logError("api.unhandled_error", error, { route: `GET /api/v1/items/${id}/bookings` });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
