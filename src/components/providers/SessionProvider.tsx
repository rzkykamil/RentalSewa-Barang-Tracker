"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

/**
 * Client boundary for NextAuth's SessionProvider — required so client
 * components (LoginForm, DashboardShell, ...) can call `useSession()`,
 * `signIn()`, `signOut()`, and `getSession()`.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
