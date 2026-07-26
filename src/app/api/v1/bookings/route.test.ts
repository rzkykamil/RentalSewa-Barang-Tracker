import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";

/**
 * Integration tests for `GET`/`POST /api/v1/bookings` against the real test
 * database — exercises Zod validation + date-range validation (BR2) +
 * service layer + response envelope shape together, per
 * .claude/rules/testing.md. `getServerSession` is mocked the same way as
 * `items/route.test.ts`.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET, POST } = await import("@/app/api/v1/bookings/route");

const createdUserIds: string[] = [];

async function createUser(tag: string, role: "OWNER" | "RENTER") {
  const email = `qa-bookings-route-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `User ${tag}`, email, passwordHash: "not-used", role },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createAvailableItem(ownerId: string, tag: string) {
  return createItem(ownerId, { name: `Item ${tag}`, category: "Elektronik", condition: "BAIK", pricePerDay: 50000 }, []);
}

function dateString(daysFromNow: number): string {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + daysFromNow);
  return base.toISOString().slice(0, 10);
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

function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/bookings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/v1/bookings", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost:3000/api/v1/bookings"));
    expect(response.status).toBe(401);
  });

  it("mengembalikan daftar booking milik Renter dengan envelope { data, meta.pagination }", async () => {
    const renter = await createUser("get-list", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(new NextRequest("http://localhost:3000/api/v1/bookings"));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.pagination).toEqual(expect.objectContaining({ page: 1, limit: 20 }));
  });
});

describe("POST /api/v1/bookings", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await POST(
      buildPostRequest({ itemId: randomUUID(), startDate: dateString(1), endDate: dateString(2) })
    );
    expect(response.status).toBe(401);
  });

  it("mengembalikan FORBIDDEN 403 saat user login berperan OWNER", async () => {
    const owner = await createUser("forbidden-owner", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await POST(
      buildPostRequest({ itemId: randomUUID(), startDate: dateString(1), endDate: dateString(2) })
    );
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("membuat booking baru untuk Renter dan mengembalikan status 201 dengan total_price benar (BR2)", async () => {
    const owner = await createUser("create-201-owner", "OWNER");
    const renter = await createUser("create-201-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "create-201");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await POST(
      buildPostRequest({ itemId: item.id, startDate: dateString(1), endDate: dateString(3) })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.status).toBe("PENDING");
    expect(body.data.totalPrice).toBe(150000); // 3 hari inklusif x 50000
  });

  it("menolak endDate sebelum startDate dengan VALIDATION_ERROR 400 (BR2 — validasi rentang tanggal)", async () => {
    const owner = await createUser("invalid-range-owner", "OWNER");
    const renter = await createUser("invalid-range-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "invalid-range");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await POST(
      buildPostRequest({ itemId: item.id, startDate: dateString(5), endDate: dateString(1) })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak startDate di masa lalu dengan VALIDATION_ERROR 400", async () => {
    const owner = await createUser("past-date-owner", "OWNER");
    const renter = await createUser("past-date-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "past-date");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await POST(
      buildPostRequest({ itemId: item.id, startDate: dateString(-2), endDate: dateString(1) })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("mengembalikan NOT_FOUND 404 saat itemId tidak ditemukan", async () => {
    const renter = await createUser("item-not-found-renter", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await POST(
      buildPostRequest({ itemId: randomUUID(), startDate: dateString(1), endDate: dateString(2) })
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
