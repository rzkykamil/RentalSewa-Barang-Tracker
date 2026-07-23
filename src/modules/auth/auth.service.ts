import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

/**
 * Verifies user credentials against the stored password hash.
 * Used by the NextAuth credentials provider `authorize()` callback.
 *
 * Returns `null` for any invalid case (unknown email, wrong password,
 * deactivated account) without distinguishing the reason to the caller,
 * to avoid leaking which part of the credential pair was wrong.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

// NOTE: Registration (register service, `POST /api/v1/auth/register`) is a
// separate backlog item under "Modul Auth" in docs/todo/backend.md and is
// intentionally not implemented here — this file currently only covers the
// "Foundation" scope (credentials verification for NextAuth login).
