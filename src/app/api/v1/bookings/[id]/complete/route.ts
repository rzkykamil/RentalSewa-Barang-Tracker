import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import {
  BookingNotFoundError,
  BookingOwnershipError,
  InvalidBookingStatusTransitionError,
  completeBooking,
} from "@/modules/bookings/bookings.service";

/**
 * `PATCH /api/v1/bookings/:id/complete` — Owner-only. Marks the item as
 * returned (`ACTIVE`/`LATE` -> `COMPLETED`) and frees the item back to
 * `TERSEDIA`, in a single `prisma.$transaction` (see
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
    return apiError("FORBIDDEN", "Hanya Owner yang dapat menyelesaikan booking.");
  }

  const { id } = await params;

  try {
    const booking = await completeBooking(id, session.user.id);
    return apiSuccess(booking);
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      return apiError("NOT_FOUND", "Booking tidak ditemukan.");
    }
    if (error instanceof BookingOwnershipError) {
      return apiError("FORBIDDEN", "Anda bukan pemilik barang pada booking ini.");
    }
    if (error instanceof InvalidBookingStatusTransitionError) {
      return apiError(
        "BUSINESS_RULE_VIOLATION",
        "Booking harus berstatus ACTIVE atau LATE untuk diselesaikan."
      );
    }
    console.error("[PATCH /api/v1/bookings/:id/complete] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
