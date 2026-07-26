import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";
import { approveBooking, createBooking } from "@/modules/bookings/bookings.service";

/**
 * Integration tests for `GET`/`PATCH /api/v1/bookings/:id/payment` against
 * the real test database — no Prisma mocking, per .claude/rules/testing.md.
 * `getServerSession` is mocked the same way as `items/[id]/route.test.ts`.
 *
 * Besides the usual auth/role/ownership/validation cases, this file
 * specifically covers the "konsistensi status pembayaran antara tampilan
 * Owner & Renter" test case from docs/todo/qa.md: the GET response body must
 * be byte-for-byte identical whether fetched by the renter or the owner, and
 * after an Owner PATCH the Renter's subsequent GET must reflect the change.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET, PATCH } = await import("@/app/api/v1/bookings/[id]/payment/route");

const createdUserIds: string[] = [];

async function createUser(tag: string, role: "OWNER" | "RENTER") {
  const email = `qa-payments-route-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `User ${tag}`, email, passwordHash: "not-used", role },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createAvailableItem(ownerId: string, tag: string) {
  return createItem(ownerId, { name: `Item ${tag}`, category: "Elektronik", condition: "BAIK", pricePerDay: 50000 }, []);
}

function dateFromToday(daysFromNow: number): Date {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + daysFromNow);
  return base;
}

/** Creates an APPROVED booking (so its auto-created Payment row exists). */
async function createApprovedBookingSetup(tag: string) {
  const owner = await createUser(tag + "-owner", "OWNER");
  const renter = await createUser(tag + "-renter", "RENTER");
  const item = await createAvailableItem(owner.id, tag);
  const booking = await createBooking(renter.id, {
    itemId: item.id,
    startDate: dateFromToday(1),
    endDate: dateFromToday(2),
  });
  await approveBooking(booking.id, owner.id);
  return { owner, renter, item, booking };
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

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function buildGetRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/bookings/x/payment");
}

function buildPatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/bookings/x/payment", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/v1/bookings/:id/payment", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET(buildGetRequest(), routeParams(randomUUID()));
    expect(response.status).toBe(401);
  });

  it("mengembalikan NOT_FOUND 404 saat booking tidak ditemukan", async () => {
    const renter = await createUser("get-booking-not-found", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(buildGetRequest(), routeParams(randomUUID()));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("mengembalikan NOT_FOUND 404 saat payment belum ada (booking belum di-approve)", async () => {
    const owner = await createUser("get-not-approved-owner", "OWNER");
    const renter = await createUser("get-not-approved-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "get-not-approved");
    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await GET(buildGetRequest(), routeParams(booking.id));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("mengembalikan FORBIDDEN 403 saat diakses user yang tidak terkait booking", async () => {
    const { booking } = await createApprovedBookingSetup("get-forbidden");
    const stranger = await createUser("get-forbidden-stranger", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: stranger.id, role: "RENTER" } });

    const response = await GET(buildGetRequest(), routeParams(booking.id));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("mengembalikan payload IDENTIK untuk Renter dan Owner (konsistensi tampilan)", async () => {
    const { owner, renter, booking } = await createApprovedBookingSetup("get-consistency");

    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });
    const renterResponse = await GET(buildGetRequest(), routeParams(booking.id));
    const renterBody = await renterResponse.json();

    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });
    const ownerResponse = await GET(buildGetRequest(), routeParams(booking.id));
    const ownerBody = await ownerResponse.json();

    expect(renterResponse.status).toBe(200);
    expect(ownerResponse.status).toBe(200);
    expect(renterBody).toEqual(ownerBody);
    expect(renterBody.data.status).toBe("BELUM_LUNAS");
  });
});

describe("PATCH /api/v1/bookings/:id/payment", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PATCH(buildPatchRequest({ status: "LUNAS" }), routeParams(randomUUID()));
    expect(response.status).toBe(401);
  });

  it("mengembalikan FORBIDDEN 403 saat role bukan OWNER", async () => {
    const renter = await createUser("patch-forbidden-role", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await PATCH(buildPatchRequest({ status: "LUNAS" }), routeParams(randomUUID()));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("mengembalikan FORBIDDEN 403 saat bukan pemilik barang pada booking tsb", async () => {
    const { booking } = await createApprovedBookingSetup("patch-not-owner");
    const otherOwner = await createUser("patch-not-owner-other", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: otherOwner.id, role: "OWNER" } });

    const response = await PATCH(buildPatchRequest({ status: "LUNAS" }), routeParams(booking.id));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("menolak status yang tidak valid dengan VALIDATION_ERROR", async () => {
    const { owner, booking } = await createApprovedBookingSetup("patch-validation");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await PATCH(buildPatchRequest({ status: "LUNAS_SEBAGIAN" }), routeParams(booking.id));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("mengembalikan BUSINESS_RULE_VIOLATION saat booking belum di-approve", async () => {
    const owner = await createUser("patch-not-approved-owner", "OWNER");
    const renter = await createUser("patch-not-approved-renter", "RENTER");
    const item = await createAvailableItem(owner.id, "patch-not-approved");
    const booking = await createBooking(renter.id, {
      itemId: item.id,
      startDate: dateFromToday(1),
      endDate: dateFromToday(2),
    });
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await PATCH(buildPatchRequest({ status: "LUNAS" }), routeParams(booking.id));
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe("BUSINESS_RULE_VIOLATION");
  });

  it("Owner menandai LUNAS + methodNote, lalu Renter melihat perubahan yang konsisten saat GET ulang", async () => {
    const { owner, renter, booking } = await createApprovedBookingSetup("patch-consistency");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const patchResponse = await PATCH(
      buildPatchRequest({ status: "LUNAS", methodNote: "Transfer BCA" }),
      routeParams(booking.id)
    );
    expect(patchResponse.status).toBe(200);
    const patchBody = await patchResponse.json();
    expect(patchBody.data.status).toBe("LUNAS");
    expect(patchBody.data.methodNote).toBe("Transfer BCA");
    expect(patchBody.data.markedPaidAt).not.toBeNull();

    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });
    const renterGetResponse = await GET(buildGetRequest(), routeParams(booking.id));
    expect(renterGetResponse.status).toBe(200);
    const renterGetBody = await renterGetResponse.json();

    expect(renterGetBody.data.status).toBe("LUNAS");
    expect(renterGetBody.data.methodNote).toBe("Transfer BCA");
    expect(renterGetBody.data).toEqual(patchBody.data);
  });
});
