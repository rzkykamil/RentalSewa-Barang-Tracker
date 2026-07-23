import { z } from "zod";
import type { NextRequest } from "next/server";

import { apiError, apiSuccess } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { EmailAlreadyRegisteredError, registerUser } from "@/modules/auth/auth.service";

/**
 * `POST /api/v1/auth/register` — public registration for Owner/Renter
 * accounts. Route handler stays thin: Zod validation + rate limiting here,
 * business logic (hashing, uniqueness check) lives in
 * `src/modules/auth/auth.service.ts` (see .claude/rules/api-design.md).
 */

const REGISTER_RATE_LIMIT = 5;

const registerSchema = z.object({
  name: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(120),
  email: z.string().trim().min(1, "Email wajib diisi.").email("Format email tidak valid.").max(160),
  password: z.string().min(8, "Kata sandi minimal 8 karakter."),
  // ADMIN is intentionally excluded — registration can only self-assign
  // OWNER/RENTER, per docs/prd.md permission matrix.
  role: z.enum(["OWNER", "RENTER"], {
    message: "Pilih peran (Owner/Renter).",
  }),
  phone: z.string().trim().max(30).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit("auth:register", ip, REGISTER_RATE_LIMIT);
  if (!rateLimit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Terlalu banyak percobaan registrasi. Coba lagi dalam beberapa saat."
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Body request tidak valid (harus JSON).");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Input registrasi tidak valid.", {
      details: parsed.error.issues,
    });
  }

  try {
    const user = await registerUser(parsed.data);
    return apiSuccess(user, { status: 201 });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      return apiError("CONFLICT", "Email ini sudah terdaftar. Gunakan email lain atau masuk.");
    }
    console.error("[POST /api/v1/auth/register] unexpected error", error);
    return apiError("INTERNAL_ERROR", "Terjadi kesalahan pada server. Coba lagi nanti.");
  }
}
