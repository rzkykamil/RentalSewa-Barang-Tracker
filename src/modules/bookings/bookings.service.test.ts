import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";
import {
  BookingNotFoundError,
  BookingOwnershipError,
  InvalidBookingStatusTransitionError,
  ItemNotAvailableError,
  ItemNotFoundError,
  activateBooking,
  approveBooking,
  completeBooking,
  createBooking,
  rejectBooking,
} from "@/modules/bookings/bookings.service";

/**
 * Integration tests against the real test database (see .env.test /
 * vitest.setup.ts) — no Prisma mocking, per .claude/rules/testing.md.
 * Covers BR1 (lock ketersediaan on approve + auto-reject other PENDING
 * requests), BR2 (total_price calculation), and the booking status machine
 * (PENDING -> APPROVED -> ACTIVE -> COMPLETED, approve/reject, invalid
 * transitions). Every user/item created here is tagged with a unique
 * `qa-bookings-service-*` marker so tests stay independent, and rows are
 * cleaned up in `afterAll`.
 */

const createdUserIds: string[] = [];

async function createOwner(tag: string) {
  const email = `qa-bookings-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `Owner ${tag}`, email, passwordHash: "not-used-in-this-test", role: "OWNER" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createRenter(tag: string) {
  const email = `qa-bookings-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `Renter ${tag}`, email, passwordHash: "not-used-in-this-test", role: "RENTER" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createAvailableItem(ownerId: string, tag: string, pricePerDay = 50000) {
  return createItem(ownerId, { name: `Item ${tag}`, category: "Elektronik", condition: "BAIK", pricePerDay }, []);
}

/** Date-only UTC date `daysFromNow` days from today, matching how the route parses `YYYY-MM-DD`. */
function dateFromToday(daysFromNow: number): Date {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + daysFromNow);
  return base;
}

afterAll(async () => {
  await prisma.payment.deleteMany({ where: { booking: { renterId: { in: createdUserIds } } } });
  await prisma.booking.deleteMany({ where: { renterId: { in: createdUserIds } } });
  await prisma.item.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe("createBooking (BR2 — total_price calculation)", () => {
  it("menghitung total_price = harga_per_hari x jumlah_hari inklusif kedua tanggal", async () => {
    const owner = await createOwner("br2-basic");
    const renter = await createRenter("br2-basic");
    const item = await createAvailableItem(owner.id, "br2-basic", 50000);

    // 3 hari inklusif: day 1, day 2, day 3.
    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(3),
    });

    expect(booking.totalPrice).toBe(150000);
    expect(booking.status).toBe("PENDING");
  });

  it("menghitung total_price untuk sewa satu hari (startDate == endDate) sebagai 1 hari", async () => {
    const owner = await createOwner("br2-same-day");
    const renter = await createRenter("br2-same-day");
    const item = await createAvailableItem(owner.id, "br2-same-day", 20000);

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(1),
    });

    expect(booking.totalPrice).toBe(20000);
  });

  it("melempar ItemNotFoundError saat itemId tidak ditemukan", async () => {
    const renter = await createRenter("br2-item-not-found");

    await expect(
      createBooking(renter.id, { itemId: randomUUID(), startDate: dateFromToday(1), endDate: dateFromToday(2) })
    ).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  it("melempar ItemNotAvailableError saat barang sedang DISEWA (bukan TERSEDIA)", async () => {
    const owner = await createOwner("br2-not-available");
    const renterA = await createRenter("br2-not-available-a");
    const renterB = await createRenter("br2-not-available-b");
    const item = await createAvailableItem(owner.id, "br2-not-available");

    const firstBooking = await createBooking(renterA.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(firstBooking.id, owner.id); // locks item to DISEWA (BR1)

    await expect(
      createBooking(renterB.id, { itemId: item.id, startDate: dateFromToday(5), endDate: dateFromToday(6) })
    ).rejects.toBeInstanceOf(ItemNotAvailableError);
  });
});

describe("approveBooking (BR1 — lock ketersediaan)", () => {
  it("mengunci barang menjadi DISEWA dan menyetujui booking yang PENDING", async () => {
    const owner = await createOwner("br1-lock");
    const renter = await createRenter("br1-lock");
    const item = await createAvailableItem(owner.id, "br1-lock");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    const approved = await approveBooking(booking.id, owner.id);
    expect(approved.status).toBe("APPROVED");
    expect(approved.approvedAt).not.toBeNull();

    const updatedItem = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(updatedItem.status).toBe("DISEWA");
  });

  it("otomatis menolak request PENDING lain untuk barang yang sama saat salah satu di-approve", async () => {
    const owner = await createOwner("br1-auto-reject");
    const renterA = await createRenter("br1-auto-reject-a");
    const renterB = await createRenter("br1-auto-reject-b");
    const renterC = await createRenter("br1-auto-reject-c");
    const item = await createAvailableItem(owner.id, "br1-auto-reject");

    const bookingA = await createBooking(renterA.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    const bookingB = await createBooking(renterB.id, {
      itemId: item.id,
      startDate: dateFromToday(3),
      endDate: dateFromToday(4),
    });
    const bookingC = await createBooking(renterC.id, {
      itemId: item.id,
      startDate: dateFromToday(5),
      endDate: dateFromToday(6),
    });

    await approveBooking(bookingA.id, owner.id);

    const refreshedB = await prisma.booking.findUniqueOrThrow({ where: { id: bookingB.id } });
    const refreshedC = await prisma.booking.findUniqueOrThrow({ where: { id: bookingC.id } });
    expect(refreshedB.status).toBe("REJECTED");
    expect(refreshedB.rejectedAt).not.toBeNull();
    expect(refreshedC.status).toBe("REJECTED");
    expect(refreshedC.rejectedAt).not.toBeNull();
  });

  it("membuat Payment BELUM_LUNAS untuk booking yang baru di-approve", async () => {
    const owner = await createOwner("br1-payment");
    const renter = await createRenter("br1-payment");
    const item = await createAvailableItem(owner.id, "br1-payment");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(booking.id, owner.id);

    const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    expect(payment).not.toBeNull();
    expect(payment?.status).toBe("BELUM_LUNAS");
  });

  it("melempar BookingOwnershipError saat yang approve bukan pemilik barang", async () => {
    const owner = await createOwner("br1-ownership");
    const otherOwner = await createOwner("br1-ownership-other");
    const renter = await createRenter("br1-ownership");
    const item = await createAvailableItem(owner.id, "br1-ownership");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    await expect(approveBooking(booking.id, otherOwner.id)).rejects.toBeInstanceOf(BookingOwnershipError);
  });

  it("melempar BookingNotFoundError saat booking tidak ditemukan", async () => {
    const owner = await createOwner("br1-not-found");
    await expect(approveBooking(randomUUID(), owner.id)).rejects.toBeInstanceOf(BookingNotFoundError);
  });
});

describe("Status machine booking", () => {
  it("mengizinkan alur normal lengkap: PENDING -> APPROVED -> ACTIVE -> COMPLETED", async () => {
    const owner = await createOwner("machine-happy");
    const renter = await createRenter("machine-happy");
    const item = await createAvailableItem(owner.id, "machine-happy");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    expect(booking.status).toBe("PENDING");

    const approved = await approveBooking(booking.id, owner.id);
    expect(approved.status).toBe("APPROVED");

    const activated = await activateBooking(booking.id, owner.id);
    expect(activated.status).toBe("ACTIVE");
    expect(activated.activatedAt).not.toBeNull();

    const completed = await completeBooking(booking.id, owner.id);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();

    const finalItem = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(finalItem.status).toBe("TERSEDIA");
  });

  it("mengizinkan alur reject: PENDING -> REJECTED, barang tetap TERSEDIA", async () => {
    const owner = await createOwner("machine-reject");
    const renter = await createRenter("machine-reject");
    const item = await createAvailableItem(owner.id, "machine-reject");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    const rejected = await rejectBooking(booking.id, owner.id);
    expect(rejected.status).toBe("REJECTED");
    expect(rejected.rejectedAt).not.toBeNull();

    const stillItem = await prisma.item.findUniqueOrThrow({ where: { id: item.id } });
    expect(stillItem.status).toBe("TERSEDIA");
  });

  it("mengizinkan completeBooking dari status LATE (bukan hanya ACTIVE)", async () => {
    const owner = await createOwner("machine-late");
    const renter = await createRenter("machine-late");
    const item = await createAvailableItem(owner.id, "machine-late");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(booking.id, owner.id);
    await activateBooking(booking.id, owner.id);
    // Simulate BR3's scheduled job flipping an overdue ACTIVE booking to LATE.
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "LATE" } });

    const completed = await completeBooking(booking.id, owner.id);
    expect(completed.status).toBe("COMPLETED");
  });

  it("menolak approve pada booking yang sudah bukan PENDING", async () => {
    const owner = await createOwner("machine-invalid-approve");
    const renter = await createRenter("machine-invalid-approve");
    const item = await createAvailableItem(owner.id, "machine-invalid-approve");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(booking.id, owner.id);

    await expect(approveBooking(booking.id, owner.id)).rejects.toBeInstanceOf(
      InvalidBookingStatusTransitionError
    );
  });

  it("menolak reject pada booking yang sudah bukan PENDING", async () => {
    const owner = await createOwner("machine-invalid-reject");
    const renter = await createRenter("machine-invalid-reject");
    const item = await createAvailableItem(owner.id, "machine-invalid-reject");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(booking.id, owner.id);

    await expect(rejectBooking(booking.id, owner.id)).rejects.toBeInstanceOf(
      InvalidBookingStatusTransitionError
    );
  });

  it("menolak activate pada booking yang belum APPROVED (masih PENDING)", async () => {
    const owner = await createOwner("machine-invalid-activate");
    const renter = await createRenter("machine-invalid-activate");
    const item = await createAvailableItem(owner.id, "machine-invalid-activate");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    await expect(activateBooking(booking.id, owner.id)).rejects.toBeInstanceOf(
      InvalidBookingStatusTransitionError
    );
  });

  it("menolak complete pada booking yang belum ACTIVE/LATE (masih APPROVED)", async () => {
    const owner = await createOwner("machine-invalid-complete");
    const renter = await createRenter("machine-invalid-complete");
    const item = await createAvailableItem(owner.id, "machine-invalid-complete");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(booking.id, owner.id);

    await expect(completeBooking(booking.id, owner.id)).rejects.toBeInstanceOf(
      InvalidBookingStatusTransitionError
    );
  });

  it("melempar BookingOwnershipError saat reject/activate/complete dilakukan oleh bukan pemilik barang", async () => {
    const owner = await createOwner("machine-ownership");
    const otherOwner = await createOwner("machine-ownership-other");
    const renter = await createRenter("machine-ownership");
    const item = await createAvailableItem(owner.id, "machine-ownership");

    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    await expect(rejectBooking(booking.id, otherOwner.id)).rejects.toBeInstanceOf(BookingOwnershipError);

    await approveBooking(booking.id, owner.id);
    await expect(activateBooking(booking.id, otherOwner.id)).rejects.toBeInstanceOf(BookingOwnershipError);

    await activateBooking(booking.id, owner.id);
    await expect(completeBooking(booking.id, otherOwner.id)).rejects.toBeInstanceOf(BookingOwnershipError);
  });
});
