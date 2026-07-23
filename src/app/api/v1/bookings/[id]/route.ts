import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import { BookingAccessError, getBookingById } from "@/modules/bookings/bookings.service";

/**
 * `GET /api/v1/bookings/:id` — detail booking. Accessible by the renter who
 * made the booking, the owner of the tied item, or Admin. Access check lives
 * in `src/modules/bookings/bookings.service.ts` (see .claude/rules/api-design.md).
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }

  const { id } = await params;

  try {
    const booking = await getBookingById(id, session.user.id, session.user.role);
    if (!booking) {
      return apiError("NOT_FOUND", "Booking tidak ditemukan.");
    }
    return apiSuccess(booking);
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return apiError("FORBIDDEN", "Anda tidak memiliki akses ke booking ini.");
    }
    console.error("[GET /api/v1/bookings/:id] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
