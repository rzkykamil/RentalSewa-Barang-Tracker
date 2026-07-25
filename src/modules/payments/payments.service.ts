import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { PaymentStatus } from "@/generated/prisma/enums";

/** Thrown when the booking referenced by a payment lookup doesn't exist. */
export class BookingNotFoundError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" not found.`);
    this.name = "BookingNotFoundError";
  }
}

/** Thrown when the acting user is neither the renter nor the item owner of the booking. */
export class PaymentAccessError extends Error {
  constructor(bookingId: string) {
    super(`Payment for booking "${bookingId}" is not accessible by the acting user.`);
    this.name = "PaymentAccessError";
  }
}

/** Thrown when the acting user is not the owner of the item tied to the booking. */
export class PaymentOwnershipError extends Error {
  constructor(bookingId: string) {
    super(`Payment for booking "${bookingId}" is not owned (via item) by the acting user.`);
    this.name = "PaymentOwnershipError";
  }
}

/** Thrown when a booking hasn't been approved yet, so no `Payment` record exists (see `approveBooking`). */
export class PaymentNotFoundError extends Error {
  constructor(bookingId: string) {
    super(`Payment for booking "${bookingId}" not found — booking may not be approved yet.`);
    this.name = "PaymentNotFoundError";
  }
}

export interface PaymentDto {
  id: string;
  bookingId: string;
  amount: number;
  status: PaymentStatus;
  methodNote: string | null;
  markedPaidAt: Date | null;
  markedByUserId: string;
}

type PaymentRecord = Prisma.PaymentGetPayload<Record<string, never>>;

function toPaymentDto(payment: PaymentRecord): PaymentDto {
  return {
    id: payment.id,
    bookingId: payment.bookingId,
    amount: Number(payment.amount),
    status: payment.status,
    methodNote: payment.methodNote,
    markedPaidAt: payment.markedPaidAt,
    markedByUserId: payment.markedByUserId,
  };
}

async function findBookingWithItemOrThrow(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });
  if (!booking) {
    throw new BookingNotFoundError(bookingId);
  }
  return booking;
}

/**
 * `GET /bookings/:id/payment` — accessible by the renter who made the
 * booking or the owner of the tied item. Returns `null` when the booking
 * hasn't been approved yet (no `Payment` row created, see `approveBooking`
 * in `src/modules/bookings/bookings.service.ts`).
 */
export async function getPaymentForBooking(
  bookingId: string,
  userId: string,
  role: "RENTER" | "OWNER" | "ADMIN"
): Promise<PaymentDto | null> {
  const booking = await findBookingWithItemOrThrow(bookingId);

  const isRenter = booking.renterId === userId;
  const isOwner = booking.item.ownerId === userId;
  if (role !== "ADMIN" && !isRenter && !isOwner) {
    throw new PaymentAccessError(bookingId);
  }

  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  return payment ? toPaymentDto(payment) : null;
}

export interface MarkPaymentInput {
  status: PaymentStatus;
  methodNote?: string | null;
}

/**
 * `PATCH /bookings/:id/payment` — Owner marks the payment status
 * (`LUNAS`/`BELUM_LUNAS`) + optional method note. `markedPaidAt` is set when
 * transitioning to `LUNAS` and cleared when reverted to `BELUM_LUNAS`.
 */
export async function markPaymentStatus(
  bookingId: string,
  ownerId: string,
  input: MarkPaymentInput
): Promise<PaymentDto> {
  const booking = await findBookingWithItemOrThrow(bookingId);
  if (booking.item.ownerId !== ownerId) {
    throw new PaymentOwnershipError(bookingId);
  }

  const existing = await prisma.payment.findUnique({ where: { bookingId } });
  if (!existing) {
    throw new PaymentNotFoundError(bookingId);
  }

  const updated = await prisma.payment.update({
    where: { bookingId },
    data: {
      status: input.status,
      methodNote: input.methodNote ?? null,
      markedPaidAt: input.status === "LUNAS" ? new Date() : null,
      markedByUserId: ownerId,
    },
  });

  return toPaymentDto(updated);
}

/** Number of `BELUM_LUNAS` payments across all of an Owner's items — used for the Owner dashboard summary card. */
export async function countUnpaidPaymentsForOwner(ownerId: string): Promise<number> {
  return prisma.payment.count({
    where: { status: "BELUM_LUNAS", booking: { item: { ownerId } } },
  });
}
