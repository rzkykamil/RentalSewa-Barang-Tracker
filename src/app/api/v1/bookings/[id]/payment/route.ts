import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import {
  BookingNotFoundError,
  PaymentAccessError,
  PaymentNotFoundError,
  PaymentOwnershipError,
  getPaymentForBooking,
  markPaymentStatus,
} from "@/modules/payments/payments.service";

/**
 * `GET /api/v1/bookings/:id/payment` (Renter/Owner terkait) and
 * `PATCH /api/v1/bookings/:id/payment` (Owner-only). Route handler stays
 * thin — access checks and status transitions live in
 * `src/modules/payments/payments.service.ts` (see .claude/rules/api-design.md).
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
    const payment = await getPaymentForBooking(id, session.user.id, session.user.role);
    if (!payment) {
      return apiError("NOT_FOUND", "Data pembayaran belum tersedia untuk booking ini.");
    }
    return apiSuccess(payment);
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      return apiError("NOT_FOUND", "Booking tidak ditemukan.");
    }
    if (error instanceof PaymentAccessError) {
      return apiError("FORBIDDEN", "Anda tidak memiliki akses ke pembayaran booking ini.");
    }
    console.error("[GET /api/v1/bookings/:id/payment] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}

const markPaymentSchema = z.object({
  status: z.enum(["BELUM_LUNAS", "LUNAS"]),
  methodNote: z.string().trim().max(255).optional(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "OWNER") {
    return apiError("FORBIDDEN", "Hanya Owner yang dapat menandai status pembayaran.");
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus JSON).");
  }

  const parsed = markPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input status pembayaran tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const payment = await markPaymentStatus(id, session.user.id, {
      status: parsed.data.status,
      methodNote: parsed.data.methodNote,
    });
    return apiSuccess(payment);
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      return apiError("NOT_FOUND", "Booking tidak ditemukan.");
    }
    if (error instanceof PaymentOwnershipError) {
      return apiError("FORBIDDEN", "Anda bukan pemilik barang pada booking ini.");
    }
    if (error instanceof PaymentNotFoundError) {
      return apiError(
        "BUSINESS_RULE_VIOLATION",
        "Booking ini belum disetujui, data pembayaran belum ada."
      );
    }
    console.error("[PATCH /api/v1/bookings/:id/payment] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
