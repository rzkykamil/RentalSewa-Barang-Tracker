import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { ItemNotFoundError, listReviewsForItem } from "@/modules/reviews/reviews.service";

/**
 * `GET /api/v1/items/:id/reviews` — public listing of reviews for an item.
 * Route handler stays thin — join/mapping logic lives in
 * `src/modules/reviews/reviews.service.ts`.
 */

const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listReviewsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const { page, limit } = parsed.data;
    const result = await listReviewsForItem(id, { page, limit });
    return apiSuccess(result.reviews, { meta: { pagination: result.pagination } });
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return apiError("NOT_FOUND", "Barang tidak ditemukan.");
    }
    logError("api.unhandled_error", error, { route: `GET /api/v1/items/${id}/reviews` });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
