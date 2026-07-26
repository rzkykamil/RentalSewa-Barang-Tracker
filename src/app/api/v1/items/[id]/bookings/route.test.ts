import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";
import { createBooking, rejectBooking } from "@/modules/bookings/bookings.service";

/**
 * Integration tests for `GET /api/v1/items/:id/bookings` (riwayat transaksi
 * per barang, khusus Owner) against the real test database.
 * `getServerSession` is mocked the same way as `items/[id]/route.test.ts`;
 * everything else (ownership check, DB reads) hits the test DB.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET } = await import("@/app/api/v1/items/[id]/bookings/route");

const createdUserIds: string[] = [];

async function createUser(tag: string, role: "OWNER" | "RENTER") {
  const email = `qa-items-id-bookings-route-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `User ${tag}`, email, passwordHash: "not-used", role },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createAvailableItem(ownerId: string, tag: string) {
  return createItem(ownerId, { name: `Item ${tag}`, category: "Elektronik", condition: "BAIK", pricePerDay: 10000 }, []);
}

function dateFromToday(daysFromNow: number): Date {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + daysFromNow);
  return base;
}

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function buildRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/v1/items/x/bookings${query}`);
}

afterEach(() => {
  mockGetServerSession.mockReset();
});

afterAll(async () => {
  await prisma.payment.deleteMany({ where: { booking: { renterId: { in: createdUserIds } } } });
  await prisma.booking.deleteMany({ where: { renterId: { in: createdUserIds } } });
  await prisma.item.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

describe("GET /api/v1/items/:id/bookings", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(buildRequest(), routeParams(randomUUID()));
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("mengembalikan FORBIDDEN 403 saat role Renter mencoba akses (role guard)", async () => {
    const renter = await createUser("forbidden-renter", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(buildRequest(), routeParams(randomUUID()));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("mengembalikan riwayat booking untuk barang milik owner sendiri", async () => {
    const owner = await createUser("own-item", "OWNER");
    const renter = await createUser("own-item-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "own-item");
    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });

    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await GET(buildRequest(), routeParams(item.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.map((b: { id: string }) => b.id)).toContain(booking.id);
  });

  it("mengembalikan FORBIDDEN 403 saat Owner mencoba akses riwayat barang milik Owner lain", async () => {
    const owner = await createUser("other-item-owner", "OWNER");
    const otherOwner = await createUser("other-item-other-owner", "OWNER");
    const item = await createAvailableItem(owner.id, "other-item");

    mockGetServerSession.mockResolvedValue({ user: { id: otherOwner.id, role: "OWNER" } });

    const response = await GET(buildRequest(), routeParams(item.id));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("memfilter riwayat barang berdasarkan query param status", async () => {
    const owner = await createUser("item-filter", "OWNER");
    const renter = await createUser("item-filter-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "item-filter");
    const rejected = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    await rejectBooking(rejected.id, owner.id);

    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await GET(buildRequest("?status=REJECTED"), routeParams(item.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(rejected.id);
  });

  it("mengembalikan NOT_FOUND 404 saat barang tidak ditemukan", async () => {
    const owner = await createUser("item-not-found", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await GET(buildRequest(), routeParams(randomUUID()));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
