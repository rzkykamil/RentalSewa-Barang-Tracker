import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import type { BookingStatus, ItemStatus, UserRole } from "@/generated/prisma/enums";

/** Thrown when a user lookup by id (for admin actions) yields nothing. */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User "${userId}" not found.`);
    this.name = "UserNotFoundError";
  }
}

/** Thrown when an Admin attempts to deactivate their own account. */
export class SelfDeactivationError extends Error {
  constructor(userId: string) {
    super(`Admin "${userId}" cannot deactivate their own account.`);
    this.name = "SelfDeactivationError";
  }
}

/** Thrown when an item lookup by id (for admin actions) yields nothing. */
export class ItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Item "${itemId}" not found.`);
    this.name = "ItemNotFoundError";
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

export interface AdminUserDto {
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

type UserRecord = Prisma.UserGetPayload<Record<string, never>>;

function toAdminUserDto(user: UserRecord): AdminUserDto {
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

export interface ListUsersFilter {
  role?: UserRole;
  isActive?: boolean;
  page: number;
  limit: number;
}

/**
 * `GET /admin/users` — full user listing for the Admin panel, optionally
 * filtered by `role`/`isActive`. No ownership scoping (Admin-only endpoint).
 */
export async function listUsers(
  filter: ListUsersFilter
): Promise<{ users: AdminUserDto[]; pagination: PaginationMeta }> {
  const where: Prisma.UserWhereInput = {
    ...(filter.role ? { role: filter.role } : {}),
    ...(filter.isActive !== undefined ? { isActive: filter.isActive } : {}),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map(toAdminUserDto),
    pagination: toPaginationMeta(filter.page, filter.limit, total),
  };
}

/**
 * `PATCH /admin/users/:id/deactivate` — sets `isActive = false`. Admin
 * self-deactivation is rejected (`SelfDeactivationError`) so the acting
 * Admin can't accidentally lock themselves out.
 */
export async function deactivateUser(userId: string, actingAdminId: string): Promise<AdminUserDto> {
  if (userId === actingAdminId) {
    throw new SelfDeactivationError(userId);
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new UserNotFoundError(userId);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return toAdminUserDto(updated);
}

export interface AdminItemDto {
  id: string;
  ownerId: string;
  name: string;
  category: string;
  pricePerDay: number;
  status: ItemStatus;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: string; name: string; email: string };
}

type ItemWithOwner = Prisma.ItemGetPayload<{ include: { owner: true } }>;

function toAdminItemDto(item: ItemWithOwner): AdminItemDto {
  return {
    id: item.id,
    ownerId: item.ownerId,
    name: item.name,
    category: item.category,
    pricePerDay: Number(item.pricePerDay),
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    owner: { id: item.owner.id, name: item.owner.name, email: item.owner.email },
  };
}

export interface ListItemsFilter {
  status?: ItemStatus;
  category?: string;
  page: number;
  limit: number;
}

/**
 * `GET /admin/items` — full item listing (including `NONAKTIF`, unlike the
 * public `GET /items` endpoint which defaults to `TERSEDIA`), including
 * owner info for moderation.
 */
export async function listItemsForAdmin(
  filter: ListItemsFilter
): Promise<{ items: AdminItemDto[]; pagination: PaginationMeta }> {
  const where: Prisma.ItemWhereInput = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.category ? { category: filter.category } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.item.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.item.count({ where }),
  ]);

  return {
    items: items.map(toAdminItemDto),
    pagination: toPaginationMeta(filter.page, filter.limit, total),
  };
}

/**
 * `PATCH /admin/items/:id/deactivate` — force-deactivates an item
 * (`status = NONAKTIF`) regardless of the owner, bypassing the ownership
 * check that `DELETE /items/:id` enforces. See decision-log.md for the
 * rationale on forcing this even while an item is `DISEWA`.
 */
export async function deactivateItemForAdmin(itemId: string): Promise<AdminItemDto> {
  const existing = await prisma.item.findUnique({ where: { id: itemId } });
  if (!existing) {
    throw new ItemNotFoundError(itemId);
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: { status: "NONAKTIF" },
    include: { owner: true },
  });

  return toAdminItemDto(updated);
}

export interface AdminBookingDto {
  id: string;
  itemId: string;
  renterId: string;
  startDate: Date;
  endDate: Date;
  status: BookingStatus;
  totalPrice: number;
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  activatedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  item: { id: string; name: string; category: string; ownerId: string; ownerName: string };
  renter: { id: string; name: string; email: string };
}

type BookingWithItemAndRenter = Prisma.BookingGetPayload<{
  include: { item: { include: { owner: true } }; renter: true };
}>;

function toAdminBookingDto(booking: BookingWithItemAndRenter): AdminBookingDto {
  return {
    id: booking.id,
    itemId: booking.itemId,
    renterId: booking.renterId,
    startDate: booking.startDate,
    endDate: booking.endDate,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    requestedAt: booking.requestedAt,
    approvedAt: booking.approvedAt,
    rejectedAt: booking.rejectedAt,
    activatedAt: booking.activatedAt,
    completedAt: booking.completedAt,
    updatedAt: booking.updatedAt,
    item: {
      id: booking.item.id,
      name: booking.item.name,
      category: booking.item.category,
      ownerId: booking.item.ownerId,
      ownerName: booking.item.owner.name,
    },
    renter: { id: booking.renter.id, name: booking.renter.name, email: booking.renter.email },
  };
}

export interface ListBookingsFilter {
  status?: BookingStatus;
  page: number;
  limit: number;
}

/**
 * `GET /admin/bookings` — read-only monitoring listing of every booking
 * (not scoped to any user), including item + renter summary info.
 */
export async function listBookingsForAdmin(
  filter: ListBookingsFilter
): Promise<{ bookings: AdminBookingDto[]; pagination: PaginationMeta }> {
  const where: Prisma.BookingWhereInput = {
    ...(filter.status ? { status: filter.status } : {}),
  };

  const [bookings, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: { item: { include: { owner: true } }, renter: true },
      orderBy: { requestedAt: "desc" },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings: bookings.map(toAdminBookingDto),
    pagination: toPaginationMeta(filter.page, filter.limit, total),
  };
}
