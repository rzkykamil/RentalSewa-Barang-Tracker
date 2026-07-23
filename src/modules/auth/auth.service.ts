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

/** Roles selectable from the public registration endpoint — ADMIN is never allowed here. */
export type RegistrableRole = Extract<UserRole, "OWNER" | "RENTER">;

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role: RegistrableRole;
  phone?: string | null;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`Email "${email}" is already registered.`);
    this.name = "EmailAlreadyRegisteredError";
  }
}

/**
 * Registers a new Owner/Renter account. Password is hashed with bcrypt
 * (cost factor 12, per docs/technical-spec.md §3) and the email is
 * normalized to lowercase to stay consistent with the lookup in
 * `verifyCredentials`.
 */
export async function registerUser(input: RegisterUserInput): Promise<AuthenticatedUser> {
  const email = input.email.toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new EmailAlreadyRegisteredError(email);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: input.role,
      phone: input.phone ?? undefined,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toUserProfile(user: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/** Fetches the profile for the currently logged-in user (`GET /auth/me`). */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toUserProfile(user) : null;
}

export interface UpdateUserProfileInput {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

/**
 * Updates mutable profile fields (name, phone, avatar) for the logged-in
 * user (`PATCH /auth/me`). Email/role/password are intentionally not
 * editable through this endpoint.
 */
export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<UserProfile | null> {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    return null;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
    },
  });

  return toUserProfile(user);
}
