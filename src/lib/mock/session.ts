/**
 * Mock authentication/session data for the frontend-only phase (Periode 1).
 *
 * There is no real NextAuth session yet — dashboard shells and profile pages
 * read a hardcoded "logged in as" user from here instead of a real session.
 * Once the auth backend module lands, this file should be replaced by real
 * session lookups (see docs/api-spec.md) and can be deleted.
 */

/** Mirrors the `role` enum planned in docs/database-design.md `users` table. */
export type MockRole = "OWNER" | "RENTER" | "ADMIN";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: MockRole;
  avatarUrl: string | null;
}

/** One hardcoded "logged in" user per role, used by each dashboard shell. */
export const MOCK_USERS: Record<MockRole, MockUser> = {
  OWNER: {
    id: "mock-owner-1",
    name: "Budi Santoso",
    email: "budi.owner@example.com",
    phone: "081234567890",
    role: "OWNER",
    avatarUrl: null,
  },
  RENTER: {
    id: "mock-renter-1",
    name: "Siti Aminah",
    email: "siti.renter@example.com",
    phone: "081298765432",
    role: "RENTER",
    avatarUrl: null,
  },
  ADMIN: {
    id: "mock-admin-1",
    name: "Admin Rental",
    email: "admin@example.com",
    phone: null,
    role: "ADMIN",
    avatarUrl: null,
  },
};

export const ROLE_LABEL: Record<MockRole, string> = {
  OWNER: "Pemilik Barang",
  RENTER: "Penyewa",
  ADMIN: "Admin",
};
