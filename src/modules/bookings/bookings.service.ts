import { prisma } from "@/lib/prisma";
import { logInfo } from "@/lib/logger";
import { Prisma } from "@/generated/prisma/client";
import type { BookingStatus } from "@/generated/prisma/enums";

/** Thrown when a booking lookup by id yields nothing. */
export class BookingNotFoundError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" not found.`);
    this.name = "BookingNotFoundError";
  }
}

/** Thrown when the acting user is neither the renter nor the item owner of the booking. */
export class BookingAccessError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" is not accessible by the acting user.`);
    this.name = "BookingAccessError";
  }
}

/** Thrown when the acting user is not the owner of the item tied to the booking. */
export class BookingOwnershipError extends Error {
  constructor(bookingId: string) {
    super(`Booking "${bookingId}" is not owned (via item) by the acting user.`);
    this.name = "BookingOwnershipError";
  }
}

/** Thrown when the referenced item does not exist. */
export class ItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Item "${itemId}" not found.`);
    this.name = "ItemNotFoundError";
  }
}

/** Thrown when a new booking request targets an item that isn't `TERSEDIA`. */
export class ItemNotAvailableError extends Error {
  constructor(itemId: string) {
    super(`Item "${itemId}" is not available for booking.`);
    this.name = "ItemNotAvailableError";
  }
}

/** Thrown when a booking status transition is attempted from an invalid current status. */
export class InvalidBookingStatusTransitionError extends Error {
  constructor(bookingId: string, expected: BookingStatus[], actual: BookingStatus) {
    super(
      `Booking "${bookingId}" must be in status [${expected.join(", ")}] for this transition, but is "${actual}".`
    );
    this.name = "InvalidBookingStatusTransitionError";
  }
}

export interface BookingDto {
  id: string;
  itemId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  totalPrice: number;
  notes: string | null;
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  activatedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}

type BookingRecord = Prisma.BookingGetPayload<Record<string, never>>;
type BookingWithItem = Prisma.BookingGetPayload<{ include: { item: true } }>;

function toBookingDto(booking: BookingRecord): BookingDto {
  return {
    id: booking.id,
    itemId: booking.itemId,
    renterId: booking.renterId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    notes: booking.notes,
    requestedAt: booking.requestedAt,
    approvedAt: booking.approvedAt,
    rejectedAt: booking.rejectedAt,
    activatedAt: booking.activatedAt,
    completedAt: booking.completedAt,
    updatedAt: booking.updatedAt,
  };
}

export interface HistoryBookingDto extends BookingDto {
  role: "OWNER" | "RENTER";
  item: {
    id: string;
    ownerId: string;
    name: string;
    category: string;
    status: string;
    pricePerDay: number;
  };
}

function toHistoryBookingDto(booking: BookingWithItem, userId: string): HistoryBookingDto {
  return {
    ...toBookingDto(booking),
    role: booking.renterId === userId ? "RENTER" : "OWNER",
    item: {
      id: booking.item.id,
      ownerId: booking.item.ownerId,
      name: booking.item.name,
      category: booking.item.category,
      status: booking.item.status,
      pricePerDay: Number(booking.item.pricePerDay),
    },
  };
}

export interface ItemBookingDto extends BookingDto {
  renter: { id: string; name: string; email: string; };
}

type BookingWithRenter = Prisma.BookingGetPayload<{ include: { renter: true } }>;

function toItemBookingDto(booking: BookingWithRenter): ItemBookingDto {
  return { ...toBookingDto(booking), renter: { id: booking.renter.id, name: booking.renter.name, email: booking.renter.email } };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListBookingsFilter {
  status?: BookingStatus;
  page: number;
  limit: number;
}

export interface ListBookingsResult {
  bookings: BookingDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * `GET /bookings` scoped to the acting user: Renter sees own booking requests,
 * Owner sees bookings against their own items (join via `Item.ownerId`).
 * Admin is rejected by the route handler before this is called.
 */
export async function listBookingsForUser(
  userId: string,
  role: "RENTER" | "OWNER",
  filter: ListBookingsFilter
): Promise<ListBookingsResult> {
  const where =
    role === "RENTER"
      ? {
          renterId: userId,
          ...(filter.status ? { status: filter.status } : {}),
        }
      : {
          item: { ownerId: userId },
          ...(filter.status ? { status: filter.status } : {}),
        };

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      orderBy: { requestedAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
  ]);

  return {
    bookings: bookings.map(toBookingDto),
    pagination: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filter.limit), 1),
    },
  };
}

/**
 * `GET /bookings/:id` — accessible by the renter who made the booking, the
 * owner of the tied item, or any Admin. Returns `null` when the booking
 * doesn't exist so the route can map that to `404 NOT_FOUND`.
 */
export async function getBookingById(
  bookingId: string,
  userId: string,
  role: "RENTER" | "OWNER" | "ADMIN"
): Promise<BookingDto | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });

  if (!booking) {
    return null;
  }

  const isRenter = booking.renterId === userId;
  const isOwner = booking.item.ownerId === userId;
  if (role !== "ADMIN" && !isRenter && !isOwner) {
    throw new BookingAccessError(bookingId);
  }

  return toBookingDto(booking);
}

export interface CreateBookingInput {
  itemId: string;
  startDate: Date;
  endDate: Date;
  notes?: string | null;
}

/**
 * `POST /bookings` — Renter submits a rental request. Enforces FR#4 (date
 * range must be valid, not in the past) and BR2 (total price = price/day ×
 * inclusive day count). Only checks item availability here; the actual lock
 * (item -> `DISEWA`) happens on approval (BR1, see `approveBooking`).
 */
export async function createBooking(renterId: string, input: CreateBookingInput): Promise<BookingDto> {
  const dayCount = getInclusiveDayCount(input.startDate, input.endDate);

  const item = await prisma.item.findUnique({ where: { id: input.itemId } });
  if (!item) {
    throw new ItemNotFoundError(input.itemId);
  }
  if (item.status !== "TERSEDIA") {
    throw new ItemNotAvailableError(input.itemId);
  }

  const totalPrice = Number(item.pricePerDay) * dayCount;

  const booking = await prisma.booking.create({
    data: {
      itemId: input.itemId,
      renterId,
      startDate: input.startDate,
      endDate: input.endDate,
      notes: input.notes ?? null,
      totalPrice,
      status: "PENDING",
      requestedAt: new Date(),
    },
  });

  logInfo("booking.created", { bookingId: booking.id, itemId: booking.itemId, renterId });

  return toBookingDto(booking);
}

/** Inclusive day count between two dates, per BR2 (`docs/technical-spec.md`). */
function getInclusiveDayCount(startDate: Date, endDate: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  return diff + 1;
}

async function findBookingWithItemOrThrow(bookingId: string): Promise<BookingWithItem> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { item: true },
  });
  if (!booking) {
    throw new BookingNotFoundError(bookingId);
  }
  return booking;
}

function assertItemOwnership(booking: BookingWithItem, ownerId: string): void {
  if (booking.item.ownerId !== ownerId) {
    throw new BookingOwnershipError(booking.id);
  }
}

/**
 * `PATCH /bookings/:id/approve` — implements BR1: approves this booking,
 * auto-rejects every other `PENDING` booking for the same item, locks the
 * item to `DISEWA`, and creates the (1:1) `Payment` record for this booking
 * (`BELUM_LUNAS`, see `docs/database-design.md` §Relasi). All writes happen
 * in a single `prisma.$transaction` per `.claude/rules/api-design.md`.
 */
export async function approveBooking(bookingId: string, ownerId: string): Promise<BookingDto> {
  const booking = await findBookingWithItemOrThrow(bookingId);
  assertItemOwnership(booking, ownerId);

  if (booking.status !== "PENDING") {
    throw new InvalidBookingStatusTransitionError(bookingId, ["PENDING"], booking.status);
  }

  const now = new Date();

  const approvedBooking = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "APPROVED", approvedAt: now },
    });

    await tx.booking.updateMany({
      where: {
        itemId: booking.itemId,
        status: "PENDING",
        id: { not: bookingId },
      },
      data: { status: "REJECTED", rejectedAt: now },
    });

    await tx.item.update({
      where: { id: booking.itemId },
      data: { status: "DISEWA" },
    });

    await tx.payment.create({
      data: {
        bookingId: updated.id,
        amount: updated.totalPrice,
        status: "BELUM_LUNAS",
        markedByUserId: ownerId,
      },
    });

    return updated;
  });

  logInfo("booking.approved", { bookingId: approvedBooking.id, itemId: booking.itemId, ownerId });

  return toBookingDto(approvedBooking);
}

/** `PATCH /bookings/:id/reject` — Owner declines a still-`PENDING` request. */
export async function rejectBooking(bookingId: string, ownerId: string): Promise<BookingDto> {
  const booking = await findBookingWithItemOrThrow(bookingId);
  assertItemOwnership(booking, ownerId);

  if (booking.status !== "PENDING") {
    throw new InvalidBookingStatusTransitionError(bookingId, ["PENDING"], booking.status);
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "REJECTED", rejectedAt: new Date() },
  });

  logInfo("booking.rejected", { bookingId: updated.id, itemId: booking.itemId, ownerId });

  return toBookingDto(updated);
}

/** `PATCH /bookings/:id/activate` — Owner marks handover as done for an `APPROVED` booking. */
export async function activateBooking(bookingId: string, ownerId: string): Promise<BookingDto> {
  const booking = await findBookingWithItemOrThrow(bookingId);
  assertItemOwnership(booking, ownerId);

  if (booking.status !== "APPROVED") {
    throw new InvalidBookingStatusTransitionError(bookingId, ["APPROVED"], booking.status);
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "ACTIVE", activatedAt: new Date() },
  });

  logInfo("booking.activated", { bookingId: updated.id, itemId: booking.itemId, ownerId });

  return toBookingDto(updated);
}

/**
 * `PATCH /bookings/:id/complete` — Owner marks the item as returned, from
 * either `ACTIVE` or `LATE` (BR3 may have already flipped it to `LATE`).
 * Returns the item to `TERSEDIA` in the same transaction.
 */
export async function completeBooking(bookingId: string, ownerId: string): Promise<BookingDto> {
  const booking = await findBookingWithItemOrThrow(bookingId);
  assertItemOwnership(booking, ownerId);

  if (booking.status !== "ACTIVE" && booking.status !== "LATE") {
    throw new InvalidBookingStatusTransitionError(bookingId, ["ACTIVE", "LATE"], booking.status);
  }

  const now = new Date();

  const completedBooking = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "COMPLETED", completedAt: now },
    });

    await tx.item.update({
      where: { id: booking.itemId },
      data: { status: "TERSEDIA" },
    });

    return updated;
  });

  logInfo("booking.completed", { bookingId: completedBooking.id, itemId: booking.itemId, ownerId });

  return toBookingDto(completedBooking);
}

export async function listHistoryForUser(
  userId: string,
  filter: { status?: BookingStatus; page: number; limit: number }
): Promise<{ bookings: HistoryBookingDto[]; pagination: PaginationMeta }> {
  const where: Prisma.BookingWhereInput = {
    ...(filter.status ? { status: filter.status } : {}),
    OR: [{ renterId: userId }, { item: { ownerId: userId } }],
  };

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { item: true },
      orderBy: [{ updatedAt: "desc" }, { requestedAt: "desc" }],
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map((booking) => toHistoryBookingDto(booking, userId)),
    pagination: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filter.limit), 1),
    },
  };
}

export async function listBookingsForItem(
  itemId: string,
  userId: string,
  role: "OWNER" | "ADMIN",
  filter: { status?: BookingStatus; page: number; limit: number }
): Promise<{ bookings: ItemBookingDto[]; pagination: PaginationMeta }> {
  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) throw new ItemNotFoundError(itemId);
  if (role !== "ADMIN" && item.ownerId !== userId) throw new BookingAccessError(itemId);

  const where: Prisma.BookingWhereInput = { itemId, ...(filter.status ? { status: filter.status } : {}) };

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { renter: true },
      orderBy: [{ requestedAt: "desc" }, { updatedAt: "desc" }],
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(toItemBookingDto),
    pagination: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filter.limit), 1),
    },
  };
}
