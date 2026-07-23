/**
 * Mock admin data aggregation for the frontend-only phase (Periode 16 — see
 * docs/development-workflow.md). `src/lib/mock/session.ts` only defines one
 * `MockUser` per role (the "logged in as" user for each dashboard shell),
 * which isn't enough for an admin "all users" list — the Owner/Renter
 * display names referenced from `MOCK_ITEMS`/`MOCK_BOOKINGS` (`OTHER_OWNERS`
 * in items.ts, `OTHER_RENTERS` in bookings.ts) are plain `{id, name}` pairs,
 * not full `MockUser` records with email/phone.
 *
 * This file builds a full user directory (`ALL_USERS`) for the admin panel
 * by combining `MOCK_USERS` with those other owners/renters, filling in
 * plausible email/phone values. It also introduces `isActive`, a field the
 * admin panel needs (docs/todo/frontend.md "aksi nonaktifkan") that doesn't
 * exist on the global `MockUser` type — extended here via `AdminUser`
 * rather than changing `session.ts`, so other already-completed modules
 * that depend on `MockUser` are unaffected (see docs/decision-log.md).
 *
 * `MOCK_ITEMS`/`MOCK_BOOKINGS` themselves are NOT duplicated here — the
 * admin items/bookings pages import them directly from their original
 * mock files.
 *
 * Once the admin backend module lands, this file should be replaced by
 * real API calls (see docs/api-spec.md) and can be deleted.
 */

import { OTHER_RENTERS } from "@/lib/mock/bookings";
import { OTHER_OWNERS } from "@/lib/mock/items";
import { MOCK_USERS, type MockUser } from "@/lib/mock/session";

export interface AdminUser extends MockUser {
  isActive: boolean;
}

/** The one "logged in" user per role, extended with the admin-only `isActive` flag. */
const PRIMARY_USERS: AdminUser[] = [
  { ...MOCK_USERS.OWNER, isActive: true },
  { ...MOCK_USERS.RENTER, isActive: true },
  { ...MOCK_USERS.ADMIN, isActive: true },
];

/** Other owners referenced by MOCK_ITEMS, promoted to full AdminUser records. */
const OTHER_OWNER_USERS: AdminUser[] = OTHER_OWNERS.map((owner, index) => ({
  id: owner.id,
  name: owner.name,
  email: `${owner.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
  phone: `08213456${(7000 + index).toString().slice(-4)}`,
  role: "OWNER",
  avatarUrl: null,
  isActive: true,
}));

/** Other renters referenced by MOCK_BOOKINGS, promoted to full AdminUser records. */
const OTHER_RENTER_USERS: AdminUser[] = OTHER_RENTERS.map((renter, index) => ({
  id: renter.id,
  name: renter.name,
  email: `${renter.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
  phone: `08219876${(5000 + index).toString().slice(-4)}`,
  role: "RENTER",
  avatarUrl: null,
  isActive: true,
}));

/** Full user directory for the admin panel — every user known across the mock dataset. */
export const ALL_USERS: AdminUser[] = [...PRIMARY_USERS, ...OTHER_OWNER_USERS, ...OTHER_RENTER_USERS];
