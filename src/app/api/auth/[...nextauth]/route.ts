import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { authOptions } from "@/modules/auth/auth-options";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

const LOGIN_RATE_LIMIT = 5;

/**
 * Wraps the NextAuth handler to rate-limit login attempts per IP (~5/min,
 * see docs/technical-spec.md §6). This can't live inside the credentials
 * `authorize()` callback in auth-options.ts because a rejection there
 * always surfaces as a generic 401 to the client — NextAuth doesn't let
 * `authorize()` control the HTTP status code. Intercepting the specific
 * `POST /api/auth/callback/credentials` request here lets us return a
 * proper `429 RATE_LIMITED` response before NextAuth's own handler runs.
 */
async function POST(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const isCredentialsLogin = request.nextUrl.pathname.endsWith("/callback/credentials");

  if (isCredentialsLogin) {
    const ip = getClientIp(request.headers);
    const rateLimit = checkRateLimit("auth:login", ip, LOGIN_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Terlalu banyak percobaan login. Coba lagi dalam beberapa saat.",
          },
        },
        { status: 429 }
      );
    }
  }

  return handler(request, context);
}

export { handler as GET, POST };
