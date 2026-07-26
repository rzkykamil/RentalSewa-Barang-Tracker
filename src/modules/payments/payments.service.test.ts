import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";
import { approveBooking, createBooking } from "@/modules/bookings/bookings.service";
import {
  BookingNotFoundError,
  PaymentAccessError,
  PaymentNotFoundError,
  PaymentOwnershipError,
  countUnpaidPaymentsForOwner,
  getPaymentForBooking,
  markPaymentStatus,
} from "@/modules/payments/payments.service";

/**
 * Integration tests against the real test database (see .env.test /
 * vitest.setup.ts) — no Prisma mocking, per .claude/rules/testing.md.
 * Covers Payment Tracking's status-update rules (mark LUNAS/BELUM_LUNAS +
 * method note, ownership check, payment-not-found when booking isn't
 * approved) and the access rules for reading a payment (renter/owner/admin
 * vs unrelated user), plus the Owner dashboard unpaid-count helper. Every
 * user/item created here is tagged with a unique `qa-payments-service-*`
 * marker so tests stay independent, and rows are cleaned up in `afterAll`.
 */

const createdUserIds: string[] = [];

async function createOwner(tag: string) {
  const email = `qa-payments-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `Owner ${tag}`, email, passwordHash: "not-used-in-this-test", role: "OWNER" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createRenter(tag: string) {
  const email = `qa-payments-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `Renter ${tag}`, email, passwordHash: "not-used-in-this-test", role: "RENTER" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createAdmin(tag: string) {
  const email = `qa-payments-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `Admin ${tag}`, email, passwordHash: "not-used-in-this-test", role: "ADMIN" },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createAvailableItem(ownerId: string, tag: string, pricePerDay = 50000) {
  return createItem(ownerId, { name: `Item ${tag}`, category: "Elektronik", condition: "BAIK", pricePerDay }, []);
}

function dateFromToday(daysFromNow: number): Date {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + daysFromNow);
  return base;
}

/** Creates an APPROVED booking (so its auto-created Payment row exists) for a fresh owner/renter/item trio. */
async function createApprovedBookingSetup(tag: string) {
  const owner = await createOwner(tag);
  const renter = await createRenter(tag);
  const item = await createAvailableItem(owner.id, tag);
  const booking = await createBooking(renter.id, {
    itemId: item.id,
    startDate: dateFromToday(1),
    endDate: dateFromToday(2),
  });
  await approveBooking(booking.id, owner.id);
  return { owner, renter, item, booking };
}

afterAll(async () => {
  await prisma.payment.deleteMany({ where: { booking: { renterId: { in: createdUserIds } } } });
  await prisma.booking.deleteMany({ where: { renterId: { in: createdUserIds } } });
  await prisma.item.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe("markPaymentStatus", () => {
  it("menandai pembayaran menjadi LUNAS dan mengisi markedPaidAt", async () => {
    const { owner, booking } = await createApprovedBookingSetup("mark-lunas");

    const updated = await markPaymentStatus(booking.id, owner.id, { status: "LUNAS" });

    expect(updated.status).toBe("LUNAS");
    expect(updated.markedPaidAt).not.toBeNull();
    expect(updated.markedByUserId).toBe(owner.id);
  });

  it("mengembalikan status ke BELUM_LUNAS dan mengosongkan markedPaidAt", async () => {
    const { owner, booking } = await createApprovedBookingSetup("revert-belum-lunas");

    await markPaymentStatus(booking.id, owner.id, { status: "LUNAS" });
    const reverted = await markPaymentStatus(booking.id, owner.id, { status: "BELUM_LUNAS" });

    expect(reverted.status).toBe("BELUM_LUNAS");
    expect(reverted.markedPaidAt).toBeNull();
  });

  it("menyimpan methodNote saat diisi", async () => {
    const { owner, booking } = await createApprovedBookingSetup("method-note");

    const updated = await markPaymentStatus(booking.id, owner.id, {
      status: "LUNAS",
      methodNote: "Transfer BCA",
    });

    expect(updated.methodNote).toBe("Transfer BCA");
  });

  it("methodNote bersifat opsional dan default null saat tidak diisi", async () => {
    const { owner, booking } = await createApprovedBookingSetup("method-note-optional");

    const updated = await markPaymentStatus(booking.id, owner.id, { status: "LUNAS" });

    expect(updated.methodNote).toBeNull();
  });

  it("melempar PaymentOwnershipError saat yang menandai bukan pemilik barang", async () => {
    const { booking } = await createApprovedBookingSetup("ownership");
    const otherOwner = await createOwner("ownership-other");

    await expect(
      markPaymentStatus(booking.id, otherOwner.id, { status: "LUNAS" })
    ).rejects.toBeInstanceOf(PaymentOwnershipError);
  });

  it("melempar PaymentNotFoundError saat booking belum di-approve (payment belum dibuat)", async () => {
    const owner = await createOwner("not-approved");
    const renter = await createRenter("not-approved");
    const item = await createAvailableItem(owner.id, "not-approved");
    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    await expect(
      markPaymentStatus(booking.id, owner.id, { status: "LUNAS" })
    ).rejects.toBeInstanceOf(PaymentNotFoundError);
  });

  it("melempar BookingNotFoundError saat booking tidak ditemukan", async () => {
    const owner = await createOwner("booking-not-found");
    await expect(
      markPaymentStatus(randomUUID(), owner.id, { status: "LUNAS" })
    ).rejects.toBeInstanceOf(BookingNotFoundError);
  });
});

describe("getPaymentForBooking", () => {
  it("mengizinkan akses oleh renter pemilik booking", async () => {
    const { renter, booking } = await createApprovedBookingSetup("access-renter");

    const payment = await getPaymentForBooking(booking.id, renter.id, "RENTER");
    expect(payment).not.toBeNull();
    expect(payment?.bookingId).toBe(booking.id);
  });

  it("mengizinkan akses oleh owner barang", async () => {
    const { owner, booking } = await createApprovedBookingSetup("access-owner");

    const payment = await getPaymentForBooking(booking.id, owner.id, "OWNER");
    expect(payment).not.toBeNull();
    expect(payment?.bookingId).toBe(booking.id);
  });

  it("mengizinkan akses oleh Admin meskipun bukan pihak terkait booking", async () => {
    const { booking } = await createApprovedBookingSetup("access-admin");
    const admin = await createAdmin("access-admin");

    const payment = await getPaymentForBooking(booking.id, admin.id, "ADMIN");
    expect(payment).not.toBeNull();
    expect(payment?.bookingId).toBe(booking.id);
  });

  it("melempar PaymentAccessError saat diakses user yang tidak terkait booking", async () => {
    const { booking } = await createApprovedBookingSetup("access-denied");
    const stranger = await createRenter("access-denied-stranger");

    await expect(getPaymentForBooking(booking.id, stranger.id, "RENTER")).rejects.toBeInstanceOf(
      PaymentAccessError
    );
  });

  it("mengembalikan null saat payment belum ada (booking belum di-approve)", async () => {
    const owner = await createOwner("access-null");
    const renter = await createRenter("access-null");
    const item = await createAvailableItem(owner.id, "access-null");
    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    const payment = await getPaymentForBooking(booking.id, renter.id, "RENTER");
    expect(payment).toBeNull();
  });

  it("melempar BookingNotFoundError saat booking tidak ditemukan", async () => {
    const renter = await createRenter("booking-not-found-get");
    await expect(getPaymentForBooking(randomUUID(), renter.id, "RENTER")).rejects.toBeInstanceOf(
      BookingNotFoundError
    );
  });
});

describe("countUnpaidPaymentsForOwner", () => {
  it("menghitung jumlah payment BELUM_LUNAS lintas semua barang milik owner", async () => {
    const owner = await createOwner("count-unpaid");
    const renterA = await createRenter("count-unpaid-a");
    const renterB = await createRenter("count-unpaid-b");
    const itemA = await createAvailableItem(owner.id, "count-unpaid-a");
    const itemB = await createAvailableItem(owner.id, "count-unpaid-b");

    const bookingA = await createBooking(renterA.id, {
      itemId: itemA.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(bookingA.id, owner.id); // Payment #1: BELUM_LUNAS

    const bookingB = await createBooking(renterB.id, {
      itemId: itemB.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(bookingB.id, owner.id); // Payment #2: BELUM_LUNAS -> marked LUNAS below
    await markPaymentStatus(bookingB.id, owner.id, { status: "LUNAS" });

    const unpaidCount = await countUnpaidPaymentsForOwner(owner.id);
    expect(unpaidCount).toBe(1);
  });

  it("tidak menghitung payment milik owner lain", async () => {
    const owner = await createOwner("count-isolated");
    const otherOwner = await createOwner("count-isolated-other");
    const renter = await createRenter("count-isolated");
    const otherItem = await createAvailableItem(otherOwner.id, "count-isolated-other");

    const booking = await createBooking(renter.id, {
      itemId: otherItem.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await approveBooking(booking.id, otherOwner.id);

    const unpaidCount = await countUnpaidPaymentsForOwner(owner.id);
    expect(unpaidCount).toBe(0);
  });
});
