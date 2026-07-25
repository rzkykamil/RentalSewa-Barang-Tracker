import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import { ItemNotFoundError, deactivateItemForAdmin } from "@/modules/admin/admin.service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * `PATCH /api/v1/admin/items/:id/deactivate` — Admin-only, force-deactivates
 * an item (`status = NONAKTIF`) regardless of who owns it.
 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "ADMIN") {
    return apiError("FORBIDDEN", "Hanya Admin yang dapat menonaktifkan barang secara paksa.");
  }

  const { id } = await params;

  try {
    const item = await deactivateItemForAdmin(id);
    return apiSuccess(item);
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return apiError("NOT_FOUND", "Barang tidak ditemukan.");
    }
    console.error(`[PATCH /api/v1/admin/items/${id}/deactivate] unexpected error`, error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
