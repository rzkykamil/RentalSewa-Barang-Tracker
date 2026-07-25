import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/modules/auth/auth-options";
import { getUserProfile, type UserProfile } from "@/modules/auth/auth.service";

/**
 * Server-side helper for the per-role dashboard layouts/pages: resolves the
 * NextAuth session into a full user profile. `middleware.ts` already blocks
 * unauthenticated/wrong-role requests before they reach these routes, so the
 * redirects here are a defense-in-depth fallback (e.g. user deactivated or
 * deleted after the JWT was issued), not the primary guard.
 */
export async function getCurrentUser(): Promise<UserProfile> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect("/login");
  }

  return profile;
}
