import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import {
  ItemNotFoundError,
  ItemOwnershipError,
  deactivateItem,
  getItemById,
  updateItem,
} from "@/modules/items/items.service";

/**
 * `GET /api/v1/items/:id` (public detail), `PATCH /api/v1/items/:id` and
 * `DELETE /api/v1/items/:id` (owner-only). Route handler stays thin —
 * ownership check lives in `src/modules/items/items.service.ts` (see
 * .claude/rules/api-design.md), not just here.
 */

const ITEM_CONDITION_VALUES = ["BAIK", "CUKUP", "RUSAK_RINGAN"] as const;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const item = await getItemById(id);
  if (!item) {
    return apiError("NOT_FOUND", "Barang tidak ditemukan.");
  }

  return apiSuccess(item);
}

const updateItemSchema = z
  .object({
    name: z.string().trim().min(1, "Nama barang tidak boleh kosong.").max(160).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.string().trim().min(1, "Kategori tidak boleh kosong.").max(80).optional(),
    condition: z.enum(ITEM_CONDITION_VALUES, { message: "Kondisi barang tidak valid." }).optional(),
    pricePerDay: z.coerce.number().positive("Harga sewa per hari harus lebih dari 0.").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update barang.",
  });

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "OWNER") {
    return apiError("FORBIDDEN", "Hanya Owner yang dapat mengubah barang.");
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus JSON).");
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input update barang tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const item = await updateItem(id, session.user.id, parsed.data);
    return apiSuccess(item);
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return apiError("NOT_FOUND", "Barang tidak ditemukan.");
    }
    if (error instanceof ItemOwnershipError) {
      return apiError("FORBIDDEN", "Anda bukan pemilik barang ini.");
    }
    console.error("[PATCH /api/v1/items/:id] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "OWNER") {
    return apiError("FORBIDDEN", "Hanya Owner yang dapat menonaktifkan barang.");
  }

  const { id } = await params;

  try {
    const item = await deactivateItem(id, session.user.id);
    return apiSuccess(item);
  } catch (error) {
    if (error instanceof ItemNotFoundError) {
      return apiError("NOT_FOUND", "Barang tidak ditemukan.");
    }
    if (error instanceof ItemOwnershipError) {
      return apiError("FORBIDDEN", "Anda bukan pemilik barang ini.");
    }
    console.error("[DELETE /api/v1/items/:id] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
