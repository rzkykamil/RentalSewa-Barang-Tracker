import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { authOptions } from "@/modules/auth/auth-options";
import { listItemsForAdmin } from "@/modules/admin/admin.service";

const ITEM_STATUS_VALUES = ["TERSEDIA", "DISEWA", "TELAT_KEMBALI", "NONAKTIF"] as const;

const listItemsQuerySchema = z.object({
  status: z.enum(ITEM_STATUS_VALUES).optional(),
  category: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * `GET /api/v1/admin/items` — full item listing (including `NONAKTIF`),
 * Admin-only. Filter `status`/`category` optional, pagination `page`/`limit`.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Hanya Admin yang dapat mengakses daftar barang.");
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listItemsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const { status, category, page, limit } = parsed.data;
    const result = await listItemsForAdmin({ status, category, page, limit });
    return apiSuccess(result.items, { meta: { pagination: result.pagination } });
  } catch (error) {
    logError("api.unhandled_error", error, { route: "GET /api/v1/admin/items" });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
