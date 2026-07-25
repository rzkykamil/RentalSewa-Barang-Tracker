import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { authOptions } from "@/modules/auth/auth-options";
import {
  BookingNotCompletedError,
  BookingNotFoundError,
  ReviewAccessError,
  ReviewAlreadyExistsError,
  createReviewForBooking,
} from "@/modules/reviews/reviews.service";

/**
 * `POST /api/v1/bookings/:id/review` — Renter-only, submits a rating/comment
 * for a `COMPLETED` booking (BR4). Route handler stays thin — ownership and
 * status checks live in `src/modules/reviews/reviews.service.ts`.
 */

interface RouteParams {
  params: Promise<{ id: string }>;
}

const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "RENTER") {
    return apiError("FORBIDDEN", "Hanya Renter yang dapat memberi review booking.");
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus JSON).");
  }

  const parsed = createReviewSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input review tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const review = await createReviewForBooking(id, session.user.id, {
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    return apiSuccess(review, { status: 201 });
  } catch (error) {
    if (error instanceof BookingNotFoundError) {
      return apiError("NOT_FOUND", "Booking tidak ditemukan.");
    }
    if (error instanceof ReviewAccessError) {
      return apiError("FORBIDDEN", "Anda bukan penyewa pada booking ini.");
    }
    if (error instanceof BookingNotCompletedError) {
      return apiError(
        "BUSINESS_RULE_VIOLATION",
        "Booking ini belum selesai (COMPLETED), review belum dapat diberikan."
      );
    }
    if (error instanceof ReviewAlreadyExistsError) {
      return apiError("CONFLICT", "Booking ini sudah pernah direview.");
    }
    logError("api.unhandled_error", error, { route: "POST /api/v1/bookings/:id/review" });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
