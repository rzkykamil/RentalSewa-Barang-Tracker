import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { UserRole } from "@/generated/prisma/enums";

/**
 * Role-level route guard, following docs/flows/auth-permission-flow.md §2.
 *
 * Scope: verifies session validity and coarse role membership for the
 * per-role dashboard route groups (`(owner)`, `(renter)`, `(admin)` — which
 * resolve to the `/owner`, `/renter`, `/admin` URL prefixes respectively).
 *
 * Out of scope (intentionally NOT handled here): ownership checks (e.g.
 * "is this Item actually owned by session.user.id") — those stay in the
 * service/route-handler layer per `.claude/rules/api-design.md`, since one
 * role can have many different users.
 */
const ROLE_BY_PATH_PREFIX: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/owner", role: "OWNER" },
  { prefix: "/renter", role: "RENTER" },
  { prefix: "/admin", role: "ADMIN" },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const matchedRule = ROLE_BY_PATH_PREFIX.find((rule) => pathname.startsWith(rule.prefix));
  if (!matchedRule) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== matchedRule.role) {
    // Authenticated, but wrong role for this dashboard — send back to the
    // public landing page rather than surfacing a raw 403 for a page route.
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/owner/:path*", "/renter/:path*", "/admin/:path*"],
};
