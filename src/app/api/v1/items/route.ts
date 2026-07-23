import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { ALLOWED_ITEM_PHOTO_MIME_TYPES, FileTooLargeError, InvalidFileTypeError } from "@/lib/upload";
import { authOptions } from "@/modules/auth/auth-options";
import { createItem, listItems } from "@/modules/items/items.service";

/**
 * `GET /api/v1/items` (public list) and `POST /api/v1/items` (Owner-only,
 * multipart create). Route handler stays thin — filtering/pagination logic
 * and photo persistence live in `src/modules/items/items.service.ts` and
 * `src/lib/upload.ts` (see .claude/rules/api-design.md).
 */

const ITEM_STATUS_VALUES = ["TERSEDIA", "DISEWA", "TELAT_KEMBALI", "NONAKTIF"] as const;
const ITEM_CONDITION_VALUES = ["BAIK", "CUKUP", "RUSAK_RINGAN"] as const;

const listItemsQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  status: z.enum(ITEM_STATUS_VALUES).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(["price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = listItemsQuerySchema.safeParse(query);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Parameter filter/pagination tidak valid.", {
      details: parsed.error.issues,
    });
  }

  const { category, status, minPrice, maxPrice, sort, page, limit } = parsed.data;
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    return apiError("VALIDATION_ERROR", "minPrice tidak boleh lebih besar dari maxPrice.");
  }

  const result = await listItems({ category, status, minPrice, maxPrice, sort, page, limit });
  return apiSuccess(result.items, { meta: { pagination: result.pagination } });
}

const createItemFieldsSchema = z.object({
  name: z.string().trim().min(1, "Nama barang wajib diisi.").max(160),
  description: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(1, "Kategori wajib diisi.").max(80),
  condition: z.enum(ITEM_CONDITION_VALUES, { message: "Kondisi barang tidak valid." }),
  pricePerDay: z.coerce.number().positive("Harga sewa per hari harus lebih dari 0."),
});

const MAX_PHOTOS_PER_ITEM = 8;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }
  if (session.user.role !== "OWNER") {
    return apiError("FORBIDDEN", "Hanya Owner yang dapat menambahkan barang.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus multipart/form-data).");
  }

  const parsed = createItemFieldsSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    category: formData.get("category"),
    condition: formData.get("condition"),
    pricePerDay: formData.get("pricePerDay"),
  });
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input barang tidak valid.", {
      details: parsed.error.issues,
    });
  }

  const photoFiles = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (photoFiles.length > MAX_PHOTOS_PER_ITEM) {
    return apiError(
      "VALIDATION_ERROR",
      `Maksimal ${MAX_PHOTOS_PER_ITEM} foto per barang.`
    );
  }

  try {
    const item = await createItem(session.user.id, parsed.data, photoFiles);
    return apiSuccess(item, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidFileTypeError) {
      return apiError(
        "VALIDATION_ERROR",
        `Tipe file foto tidak didukung. Gunakan salah satu: ${ALLOWED_ITEM_PHOTO_MIME_TYPES.join(", ")}.`
      );
    }
    if (error instanceof FileTooLargeError) {
      return apiError("VALIDATION_ERROR", "Ukuran salah satu foto melebihi batas 5MB.");
    }
    console.error("[POST /api/v1/items] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
