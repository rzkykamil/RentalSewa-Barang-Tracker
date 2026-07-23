/**
 * Mock booking data for the frontend-only phase (Periode 4 — see
 * docs/development-workflow.md). There is no real `bookings` table yet
 * (prisma/schema.prisma has zero models) — pages read this hardcoded array
 * instead of calling an API. Shape mirrors the `bookings` table planned in
 * docs/database-design.md, extended with an `activatedAt` timestamp (not
 * yet present in the planned schema) to support the PENDING → APPROVED →
 * ACTIVE → COMPLETED timeline described in docs/prd.md §user stories —
 * flagged as a backend follow-up in docs/todo/backend.md.
 *
 * Once the booking backend module lands, this file should be replaced by
 * real API calls (see docs/api-spec.md) and can be deleted.
 */

import { MOCK_ITEMS } from "@/lib/mock/items";
import { MOCK_USERS } from "@/lib/mock/session";

/** Mirrors the `status` enum planned in docs/database-design.md `bookings` table. */
export type MockBookingStatus = "PENDING" | "APPROVED" | "ACTIVE" | "COMPLETED" | "REJECTED";

export interface MockBooking {
  id: string;
  itemId: string;
  itemName: string;
  itemPricePerDay: number;
  ownerId: string;
  ownerName: string;
  renterId: string;
  renterName: string;
  startDate: string;
  endDate: string;
  status: MockBookingStatus;
  totalPrice: number;
  notes: string | null;
  requestedAt: string;
  approvedAt: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
}

/**
 * A couple of additional mock renters (besides MOCK_USERS.RENTER) so both
 * the Owner and Renter dashboards reflect requests/bookings involving more
 * than one person, matching a real marketplace. Plain display names only —
 * not full MockUser records — since only one renter account is "logged in"
 * in this phase.
 */
export const OTHER_RENTERS = [
  { id: "mock-renter-2", name: "Rian Hidayat" },
  { id: "mock-renter-3", name: "Ayu Wulandari" },
];

/** `total_price = price_per_day * jumlah_hari` (inklusif tanggal mulai & selesai — BR2 di docs/prd.md). */
export function calculateBookingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

function itemById(itemId: string) {
  const item = MOCK_ITEMS.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error(`Mock item not found for booking seed: ${itemId}`);
  return item;
}

function buildBooking(
  input: Omit<MockBooking, "itemName" | "itemPricePerDay" | "ownerId" | "ownerName" | "totalPrice">
): MockBooking {
  const item = itemById(input.itemId);
  return {
    ...input,
    itemName: item.name,
    itemPricePerDay: item.pricePerDay,
    ownerId: item.ownerId,
    ownerName: item.ownerName,
    totalPrice: item.pricePerDay * calculateBookingDays(input.startDate, input.endDate),
  };
}

export const MOCK_BOOKINGS: MockBooking[] = [
  // -- Requests for MOCK_USERS.OWNER's items (item-1..4), for the Owner dashboard --
  buildBooking({
    id: "booking-1",
    itemId: "item-1",
    renterId: OTHER_RENTERS[0].id,
    renterName: OTHER_RENTERS[0].name,
    startDate: "2026-07-25",
    endDate: "2026-07-28",
    status: "PENDING",
    notes: "Dipakai untuk foto acara keluarga di akhir pekan.",
    requestedAt: "2026-07-18T09:00:00.000Z",
    approvedAt: null,
    activatedAt: null,
    completedAt: null,
    rejectedAt: null,
  }),
  buildBooking({
    id: "booking-2",
    itemId: "item-1",
    renterId: OTHER_RENTERS[1].id,
    renterName: OTHER_RENTERS[1].name,
    startDate: "2026-07-26",
    endDate: "2026-07-29",
    status: "PENDING",
    notes: null,
    requestedAt: "2026-07-19T10:30:00.000Z",
    approvedAt: null,
    activatedAt: null,
    completedAt: null,
    rejectedAt: null,
  }),
  buildBooking({
    id: "booking-3",
    itemId: "item-2",
    renterId: MOCK_USERS.RENTER.id,
    renterName: MOCK_USERS.RENTER.name,
    startDate: "2026-07-10",
    // Due tomorrow relative to MOCK_TODAY in src/lib/mock/reminders.ts —
    // deliberately chosen so this booking produces an H1_REMINDER for both
    // MOCK_USERS.OWNER and MOCK_USERS.RENTER (see docs/todo/frontend.md
    // Modul Reminder).
    endDate: "2026-07-21",
    status: "ACTIVE",
    notes: "Tolong sertakan pasak cadangan.",
    requestedAt: "2026-07-05T08:00:00.000Z",
    approvedAt: "2026-07-06T08:00:00.000Z",
    activatedAt: "2026-07-10T08:00:00.000Z",
    completedAt: null,
    rejectedAt: null,
  }),
  buildBooking({
    id: "booking-4",
    itemId: "item-3",
    renterId: OTHER_RENTERS[0].id,
    renterName: OTHER_RENTERS[0].name,
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    status: "COMPLETED",
    notes: null,
    requestedAt: "2026-05-28T08:00:00.000Z",
    approvedAt: "2026-05-28T14:00:00.000Z",
    activatedAt: "2026-06-01T08:00:00.000Z",
    completedAt: "2026-06-05T17:00:00.000Z",
    rejectedAt: null,
  }),
  buildBooking({
    id: "booking-5",
    itemId: "item-4",
    renterId: MOCK_USERS.RENTER.id,
    renterName: MOCK_USERS.RENTER.name,
    startDate: "2026-05-01",
    endDate: "2026-05-03",
    status: "REJECTED",
    notes: "Butuh untuk presentasi kantor.",
    requestedAt: "2026-04-28T08:00:00.000Z",
    approvedAt: null,
    activatedAt: null,
    completedAt: null,
    rejectedAt: "2026-04-29T09:00:00.000Z",
  }),
  buildBooking({
    id: "booking-6",
    itemId: "item-1",
    renterId: OTHER_RENTERS[1].id,
    renterName: OTHER_RENTERS[1].name,
    startDate: "2026-08-01",
    endDate: "2026-08-05",
    status: "APPROVED",
    notes: null,
    requestedAt: "2026-07-15T08:00:00.000Z",
    approvedAt: "2026-07-16T08:00:00.000Z",
    activatedAt: null,
    completedAt: null,
    rejectedAt: null,
  }),

  // -- MOCK_USERS.RENTER's own bookings on other owners' items, for the Renter "Booking Saya" page --
  buildBooking({
    id: "booking-7",
    itemId: "item-5",
    renterId: MOCK_USERS.RENTER.id,
    renterName: MOCK_USERS.RENTER.name,
    startDate: "2026-07-30",
    endDate: "2026-08-02",
    status: "PENDING",
    notes: "Untuk acara ulang tahun kecil di rumah.",
    requestedAt: "2026-07-19T11:00:00.000Z",
    approvedAt: null,
    activatedAt: null,
    completedAt: null,
    rejectedAt: null,
  }),
  buildBooking({
    id: "booking-8",
    itemId: "item-6",
    renterId: MOCK_USERS.RENTER.id,
    renterName: MOCK_USERS.RENTER.name,
    startDate: "2026-08-10",
    endDate: "2026-08-12",
    status: "APPROVED",
    notes: null,
    requestedAt: "2026-07-17T08:00:00.000Z",
    approvedAt: "2026-07-18T08:00:00.000Z",
    activatedAt: null,
    completedAt: null,
    rejectedAt: null,
  }),
  buildBooking({
    id: "booking-9",
    itemId: "item-7",
    renterId: MOCK_USERS.RENTER.id,
    renterName: MOCK_USERS.RENTER.name,
    startDate: "2026-06-10",
    endDate: "2026-06-15",
    status: "COMPLETED",
    notes: null,
    requestedAt: "2026-06-05T08:00:00.000Z",
    approvedAt: "2026-06-05T13:00:00.000Z",
    activatedAt: "2026-06-10T08:00:00.000Z",
    completedAt: "2026-06-15T16:00:00.000Z",
    rejectedAt: null,
  }),

  // Overdue example: still ACTIVE 3 days past its due date relative to
  // MOCK_TODAY in src/lib/mock/reminders.ts, so it produces an
  // OVERDUE_ALERT for both MOCK_USERS.OWNER and MOCK_USERS.RENTER — see
  // docs/todo/frontend.md Modul Reminder.
  buildBooking({
    id: "booking-10",
    itemId: "item-3",
    renterId: MOCK_USERS.RENTER.id,
    renterName: MOCK_USERS.RENTER.name,
    startDate: "2026-07-05",
    endDate: "2026-07-17",
    status: "ACTIVE",
    notes: null,
    requestedAt: "2026-07-01T08:00:00.000Z",
    approvedAt: "2026-07-01T13:00:00.000Z",
    activatedAt: "2026-07-05T08:00:00.000Z",
    completedAt: null,
    rejectedAt: null,
  }),
];

export function getBookingsByOwner(ownerId: string): MockBooking[] {
  return MOCK_BOOKINGS.filter((booking) => booking.ownerId === ownerId).sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

export function getBookingsByRenter(renterId: string): MockBooking[] {
  return MOCK_BOOKINGS.filter((booking) => booking.renterId === renterId).sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}
