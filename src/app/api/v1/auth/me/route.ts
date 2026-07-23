import { getServerSession } from "next-auth";
import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { authOptions } from "@/modules/auth/auth-options";
import { getUserProfile, updateUserProfile } from "@/modules/auth/auth.service";

/**
 * `GET /api/v1/auth/me` and `PATCH /api/v1/auth/me` — profile of the
 * currently logged-in user. Both require a valid NextAuth session; route
 * handler stays thin (session check + Zod validation), profile lookup/update
 * lives in `src/modules/auth/auth.service.ts`.
 */

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Nama lengkap tidak boleh kosong.").max(120).optional(),
    phone: z.string().trim().max(30).nullable().optional(),
    avatarUrl: z.string().trim().max(255).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update profil.",
  });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    return apiError("NOT_FOUND", "User tidak ditemukan.");
  }

  return apiSuccess(profile);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("UNAUTHENTICATED", "Anda belum login.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus JSON).");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input update profil tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const profile = await updateUserProfile(session.user.id, parsed.data);
    if (!profile) {
      return apiError("NOT_FOUND", "User tidak ditemukan.");
    }
    return apiSuccess(profile);
  } catch (error) {
    console.error("[PATCH /api/v1/auth/me] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
