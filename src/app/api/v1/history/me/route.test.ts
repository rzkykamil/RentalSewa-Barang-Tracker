import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";
import { approveBooking, createBooking } from "@/modules/bookings/bookings.service";

/**
 * Integration tests for `GET /api/v1/history/me` against the real test
 * database. `getServerSession` is mocked the same way as
 * `items/[id]/route.test.ts`; everything else (DB reads/writes) hits the
 * test DB — no Prisma mocking.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET } = await import("@/app/api/v1/history/me/route");

const createdUserIds: string[] = [];

async function createUser(tag: string, role: "OWNER" | "RENTER") {
  const email = `qa-history-me-route-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
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

function buildRequest(query = ""): NextRequest {
  return new NextRequest(`http://localhost:3000/api/v1/history/me${query}`);
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

describe("GET /api/v1/history/me", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(buildRequest());
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("mengembalikan riwayat booking milik user yang login, terurut dari yang terbaru diupdate", async () => {
    const owner = await createUser("sort", "OWNER");
    const renter = await createUser("sort-renter", "RENTER");
    const itemA = await createAvailableItem(owner.id, "sort-a");
    const itemB = await createAvailableItem(owner.id, "sort-b");

    const older = await createBooking(renter.id, { itemId: itemA.id, startDate: dateFromToday(1), endDate: dateFromToday(2) });
    const newer = await createBooking(renter.id, { itemId: itemB.id, startDate: dateFromToday(3), endDate: dateFromToday(4) });
    await approveBooking(older.id, owner.id); // touches updatedAt so it sorts first

    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(buildRequest());
    expect(response.status).toBe(200);
    const body = await response.json();
    const ids = body.data.map((b: { id: string }) => b.id);
    expect(ids).toEqual([older.id, newer.id]);
  });

  it("memfilter riwayat berdasarkan query param status", async () => {
    const owner = await createUser("filter", "OWNER");
    const renter = await createUser("filter-renter", "RENTER");
    const itemA = await createAvailableItem(owner.id, "filter-a");
    const itemB = await createAvailableItem(owner.id, "filter-b");

    const pending = await createBooking(renter.id, { itemId: itemA.id, startDate: dateFromToday(1), endDate: dateFromToday(2) });
    const toApprove = await createBooking(renter.id, { itemId: itemB.id, startDate: dateFromToday(3), endDate: dateFromToday(4) });
    await approveBooking(toApprove.id, owner.id);

    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(buildRequest("?status=PENDING"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const ids = body.data.map((b: { id: string; status: string }) => b.id);
    expect(ids).toContain(pending.id);
    expect(ids).not.toContain(toApprove.id);
    expect(body.data.every((b: { status: string }) => b.status === "PENDING")).toBe(true);
  });

  it("mengembalikan VALIDATION_ERROR 400 saat status tidak valid", async () => {
    const renter = await createUser("invalid-status", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(buildRequest("?status=BUKAN_STATUS"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
