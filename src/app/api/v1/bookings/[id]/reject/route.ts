import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import {
  BookingNotFoundError,
  BookingOwnershipError,
  InvalidBookingStatusTransitionError,
  rejectBooking,
} from "@/modules/bookings/bookings.service";

/**
 * `PATCH /api/v1/bookings/:id/reject` — Owner-only. Declines a still-`PENDING`
 * request; item status is untouched since it was never locked (see
 * `src/modules/bookings/bookings.service.ts`).
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "OWNER") {
    return apiError("FORBIDDEN", "Hanya Owner yang dapat menolak request sewa.");
  }

  const { id } = await params;

  try {
    const booking = await rejectBooking(id, session.user.id);
    return apiSuccess(booking);
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      return apiError("NOT_FOUND", "Booking tidak ditemukan.");
    }
    if (error instanceof BookingOwnershipError) {
      return apiError("FORBIDDEN", "Anda bukan pemilik barang pada booking ini.");
    }
    if (error instanceof InvalidBookingStatusTransitionError) {
      return apiError("BUSINESS_RULE_VIOLATION", "Booking ini sudah pernah diproses sebelumnya.");
    }
    console.error("[PATCH /api/v1/bookings/:id/reject] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
