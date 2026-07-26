// @vitest-environment node
//
// Overrides the project-wide jsdom environment (vitest.config.ts) for this
// file only. The route handler under test does `entry instanceof File` on
// parsed FormData entries (src/app/api/v1/items/route.ts) — in jsdom, the
// global `File` is jsdom's own implementation, which is a *different* class
// from the Node/undici `File` that `NextRequest#formData()` actually
// produces, so the instanceof check (and thus photo handling) silently
// breaks under jsdom. The real app runs under Node, so testing this file
// under the Node environment matches production behavior.

import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";

import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { UPLOAD_ROOT } from "@/lib/upload";

/**
 * Integration tests for `GET`/`POST /api/v1/items` against the real test
 * database — exercises Zod validation + service layer + response envelope
 * shape together, per .claude/rules/testing.md. `getServerSession` is
 * mocked (see `auth/me/route.test.ts` for the same pattern) since we don't
 * have real request cookies here; everything downstream hits the test DB.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET, POST } = await import("@/app/api/v1/items/route");

const createdUserIds: string[] = [];

async function createUser(tag: string, role: "OWNER" | "RENTER") {
  const email = `qa-items-route-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: { id: randomUUID(), name: `User ${tag}`, email, passwordHash: "not-used", role },
  });
  createdUserIds.push(user.id);
  return user;
}

afterEach(() => {
  mockGetServerSession.mockReset();
});

afterAll(async () => {
  await prisma.itemPhoto.deleteMany({ where: { item: { ownerId: { in: createdUserIds } } } });
  await prisma.item.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await rm(UPLOAD_ROOT, { recursive: true, force: true }).catch(() => undefined);
});

function buildGetRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/v1/items${query}`);
}

function buildPostFormData(fields: Record<string, string>, photos: File[] = []): FormData {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  photos.forEach((file) => formData.append("photos", file));
  return formData;
}

describe("GET /api/v1/items", () => {
  it("mengembalikan daftar barang dengan envelope { data, meta.pagination }", async () => {
    const response = await GET(buildGetRequest(""));
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it("menolak minPrice lebih besar dari maxPrice dengan VALIDATION_ERROR 400", async () => {
    const response = await GET(buildGetRequest("?minPrice=500&maxPrice=100"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak parameter sort yang tidak valid dengan VALIDATION_ERROR 400", async () => {
    const response = await GET(buildGetRequest("?sort=not-a-real-sort"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/items", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = new NextRequest("http://localhost:3000/api/v1/items", {
      method: "POST",
      body: buildPostFormData({
        name: "Barang Tanpa Login",
        category: "Elektronik",
        condition: "BAIK",
        pricePerDay: "10000",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("mengembalikan FORBIDDEN 403 saat user login berperan RENTER", async () => {
    const renter = await createUser("forbidden", "RENTER");
    mockGetServerSession.mockResolvedValue({ user: { id: renter.id, role: "RENTER" } });

    const request = new NextRequest("http://localhost:3000/api/v1/items", {
      method: "POST",
      body: buildPostFormData({
        name: "Barang Oleh Renter",
        category: "Elektronik",
        condition: "BAIK",
        pricePerDay: "10000",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("membuat barang baru untuk Owner dan mengembalikan status 201", async () => {
    const owner = await createUser("create-201", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const photo = new File([new Uint8Array([1, 2, 3])], "foto.jpg", { type: "image/jpeg" });
    const request = new NextRequest("http://localhost:3000/api/v1/items", {
      method: "POST",
      body: buildPostFormData(
        {
          name: "Kamera Route Test",
          category: "Kamera & Fotografi",
          condition: "BAIK",
          pricePerDay: "100000",
        },
        [photo]
      ),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.name).toBe("Kamera Route Test");
    expect(body.data.status).toBe("TERSEDIA");
    expect(body.data.photos).toHaveLength(1);
  });

  it("menolak input tidak valid (harga <= 0) dengan VALIDATION_ERROR 400", async () => {
    const owner = await createUser("create-invalid-price", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const request = new NextRequest("http://localhost:3000/api/v1/items", {
      method: "POST",
      body: buildPostFormData({
        name: "Barang Harga Salah",
        category: "Elektronik",
        condition: "BAIK",
        pricePerDay: "0",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak foto dengan tipe file yang tidak didukung", async () => {
    const owner = await createUser("create-bad-filetype", "OWNER");
    mockGetServerSession.mockResolvedValue({ user: { id: owner.id, role: "OWNER" } });

    const badFile = new File([new Uint8Array([1, 2, 3])], "dokumen.pdf", {
      type: "application/pdf",
    });
    const request = new NextRequest("http://localhost:3000/api/v1/items", {
      method: "POST",
      body: buildPostFormData(
        {
          name: "Barang Foto Salah",
          category: "Elektronik",
          condition: "BAIK",
          pricePerDay: "10000",
        },
        [badFile]
      ),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
