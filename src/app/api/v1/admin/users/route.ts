import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import { listUsers } from "@/modules/admin/admin.service";

const USER_ROLE_VALUES = ["OWNER", "RENTER", "ADMIN"] as const;

const listUsersQuerySchema = z.object({
  role: z.enum(USER_ROLE_VALUES).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * `GET /api/v1/admin/users` — full user listing, Admin-only. Filter
 * `role`/`isActive` optional, pagination `page`/`limit`.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Hanya Admin yang dapat mengakses daftar user.");
  }

  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listUsersQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const { role, isActive, page, limit } = parsed.data;
    const result = await listUsers({ role, isActive, page, limit });
    return apiSuccess(result.users, { meta: { pagination: result.pagination } });
  } catch (error) {
    console.error("[GET /api/v1/admin/users] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
