import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { authOptions } from "@/modules/auth/auth-options";
import {
  SelfDeactivationError,
  UserNotFoundError,
  deactivateUser,
} from "@/modules/admin/admin.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * `PATCH /api/v1/admin/users/:id/deactivate` — Admin-only, sets
 * `isActive = false` for the target user. Rejects self-deactivation.
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Hanya Admin yang dapat menonaktifkan user.");
  }

  const { id } = await params;

  try {
    const user = await deactivateUser(id, session.user.id);
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return apiError("NOT_FOUND", "User tidak ditemukan.");
    }
    if (error instanceof SelfDeactivationError) {
      return apiError("BUSINESS_RULE_VIOLATION", "Anda tidak dapat menonaktifkan akun Anda sendiri.");
    }
    logError("api.unhandled_error", error, { route: `PATCH /api/v1/admin/users/${id}/deactivate` });
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
