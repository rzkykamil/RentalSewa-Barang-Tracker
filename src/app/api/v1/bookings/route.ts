import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import {
  ItemNotAvailableError,
  ItemNotFoundError,
  createBooking,
  listBookingsForUser,
} from "@/modules/bookings/bookings.service";

/**
 * `GET /api/v1/bookings` (own bookings, Renter/Owner scoped) and
 * `POST /api/v1/bookings` (Renter-only rental request). Route handler stays
 * thin — filtering/date/price logic lives in
 * `src/modules/bookings/bookings.service.ts` (see .claude/rules/api-design.md).
 */

const BOOKING_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED", "LATE"] as const;

const listBookingsQuerySchema = z.object({
  status: z.enum(BOOKING_STATUS_VALUES).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "RENTER" && session.user.role !== "OWNER") {
    return apiError("FORBIDDEN", "Endpoint ini hanya untuk Renter atau Owner.");
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listBookingsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  const { status, page, limit } = parsed.data;
  const result = await listBookingsForUser(session.user.id, session.user.role, { status, page, limit });
  return apiSuccess(result.bookings, { meta: { pagination: result.pagination } });
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const createBookingSchema = z
  .object({
    itemId: z.string().uuid("itemId tidak valid."),
    startDate: z.string().regex(DATE_ONLY_REGEX, "startDate harus berformat YYYY-MM-DD."),
    endDate: z.string().regex(DATE_ONLY_REGEX, "endDate harus berformat YYYY-MM-DD."),
    notes: z.string().trim().max(2000).optional(),
  })
  .refine((data) => !Number.isNaN(new Date(data.startDate).getTime()), {
    message: "startDate bukan tanggal yang valid.",
    path: ["startDate"],
  })
  .refine((data) => !Number.isNaN(new Date(data.endDate).getTime()), {
    message: "endDate bukan tanggal yang valid.",
    path: ["endDate"],
  });

function getTodayDateOnly(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "RENTER") {
    return apiError("FORBIDDEN", "Hanya Renter yang dapat mengajukan request sewa.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus JSON).");
  }

  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input request sewa tidak valid.", {
      details: parsed.error.issues,
    });
  }

  const startDate = new Date(`${parsed.data.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${parsed.data.endDate}T00:00:00.000Z`);

  if (endDate.getTime() < startDate.getTime()) {
    return apiError("VALIDATION_ERROR", "endDate tidak boleh sebelum startDate.");
  }
  if (startDate.getTime() < getTodayDateOnly().getTime()) {
    return apiError("VALIDATION_ERROR", "startDate tidak boleh di masa lalu.");
  }

  try {
    const booking = await createBooking(session.user.id, {
      itemId: parsed.data.itemId,
      startDate,
      endDate,
      notes: parsed.data.notes,
    });
    return apiSuccess(booking, { status: 201 });
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return apiError("NOT_FOUND", "Barang tidak ditemukan.");
    }
    if (error instanceof ItemNotAvailableError) {
      return apiError("CONFLICT", "Barang sedang tidak tersedia untuk disewa.");
    }
    console.error("[POST /api/v1/bookings] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
