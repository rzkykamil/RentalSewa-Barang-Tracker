import { randomUUID } from "node:crypto";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createItem } from "@/modules/items/items.service";

/**
 * Integration tests for `GET`/`PATCH`/`DELETE /api/v1/items/:id` against the
 * real test database. `getServerSession` is mocked the same way as
 * `auth/me/route.test.ts`; everything else (ownership check, DB writes)
 * hits the test DB — no Prisma mocking.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET, PATCH, DELETE } = await import("@/app/api/v1/items/[id]/route");

const createdUserIds: string[] = [];

async function createUser(tag: string, role: "OWNER" | "RENTER") {
  const email = `qa-items-id-route-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `User ${tag}`, email, passwordHash: "not-used", role },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createTestItem(ownerId: string, tag: string) {
  return createItem(
    ownerId,
    { name: `Item ${tag}`, category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
    []
  );
}

afterEach(() => {
  mockGetServerSession.mockReset();
});

afterAll(async () => {
  await prisma.itemPhoto.deleteMany({ where: { item: { ownerId: { in: createdUserIds } } } });
  await prisma.item.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
});

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function buildPatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/items/x", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/v1/items/:id", () => {
  it("mengembalikan detail barang beserta ratingAverage untuk id yang ada", async () => {
    const owner = await createUser("get-detail", "OWNER");
    const item = await createTestItem(owner.id, "get-detail");

    const response = await GET(new NextRequest("http://localhost:3000/api/v1/items/x"), routeParams(item.id));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe(item.id);
    expect(body.data).toHaveProperty("ratingAverage");
  });

  it("mengembalikan NOT_FOUND 404 saat barang tidak ditemukan", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/v1/items/x"),
      routeParams(randomUUID())
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("PATCH /api/v1/items/:id", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PATCH(buildPatchRequest({ name: "X" }), routeParams(randomUUID()));
    expect(response.status).toBe(401);
  });

  it("mengembalikan FORBIDDEN 403 saat role bukan OWNER", async () => {
    const renter = await createUser("patch-forbidden", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await PATCH(buildPatchRequest({ name: "X" }), routeParams(randomUUID()));
    expect(response.status).toBe(403);
  });

  it("memperbarui barang milik sendiri dan mengembalikan status 200", async () => {
    const owner = await createUser("patch-own", "OWNER");
    const item = await createTestItem(owner.id, "patch-own");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await PATCH(
      buildPatchRequest({ name: "Nama Diperbarui", pricePerDay: 25000 }),
      routeParams(item.id)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.name).toBe("Nama Diperbarui");
    expect(body.data.pricePerDay).toBe(25000);
  });

  it("mengembalikan NOT_FOUND 404 saat barang tidak ditemukan", async () => {
    const owner = await createUser("patch-not-found", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await PATCH(buildPatchRequest({ name: "X" }), routeParams(randomUUID()));
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("mengembalikan FORBIDDEN 403 saat mengubah barang milik owner lain", async () => {
    const owner = await createUser("patch-owner-a", "OWNER");
    const otherOwner = await createUser("patch-owner-b", "OWNER");
    const item = await createTestItem(owner.id, "patch-owner-a");
    mockGetServerSession.mockResolvedValue({ user: { id: otherOwner.id, role: "OWNER" } });

    const response = await PATCH(buildPatchRequest({ name: "Diretas" }), routeParams(item.id));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("menolak body kosong dengan VALIDATION_ERROR 400", async () => {
    const owner = await createUser("patch-empty-body", "OWNER");
    const item = await createTestItem(owner.id, "patch-empty-body");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await PATCH(buildPatchRequest({}), routeParams(item.id));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("DELETE /api/v1/items/:id (nonaktifkan barang)", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/v1/items/x"),
      routeParams(randomUUID())
    );
    expect(response.status).toBe(401);
  });

  it("mengembalikan FORBIDDEN 403 saat role bukan OWNER", async () => {
    const renter = await createUser("delete-forbidden", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/v1/items/x"),
      routeParams(randomUUID())
    );
    expect(response.status).toBe(403);
  });

  it("menonaktifkan barang milik sendiri (status jadi NONAKTIF)", async () => {
    const owner = await createUser("delete-own", "OWNER");
    const item = await createTestItem(owner.id, "delete-own");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/v1/items/x"),
      routeParams(item.id)
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.status).toBe("NONAKTIF");
  });

  it("mengembalikan FORBIDDEN 403 saat menonaktifkan barang milik owner lain", async () => {
    const owner = await createUser("delete-owner-a", "OWNER");
    const otherOwner = await createUser("delete-owner-b", "OWNER");
    const item = await createTestItem(owner.id, "delete-owner-a");
    mockGetServerSession.mockResolvedValue({ user: { id: otherOwner.id, role: "OWNER" } });

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/v1/items/x"),
      routeParams(item.id)
    );
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("mengembalikan NOT_FOUND 404 saat barang tidak ditemukan", async () => {
    const owner = await createUser("delete-not-found", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const response = await DELETE(
      new NextRequest("http://localhost:3000/api/v1/items/x"),
      routeParams(randomUUID())
    );
    expect(response.status).toBe(404);
  });
});
