import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { registerUser } from "@/modules/auth/auth.service";

/**
 * Integration test for `GET`/`PATCH /api/v1/auth/me` against the real test
 * database. `getServerSession` is mocked (it depends on request cookies we
 * don't have in a unit-style handler call) but everything downstream
 * (profile lookup/update) hits the real Prisma test DB — no Prisma mocking.
 */

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

const { GET, PATCH } = await import("@/app/api/v1/auth/me/route");

const createdEmails: string[] = [];

function uniqueEmail(tag: string): string {
  const email = `qa-auth-me-route-${tag}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@test.local`;
  createdEmails.push(email);
  return email;
}

afterEach(() => {
  mockGetServerSession.mockReset();
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
});

function buildPatchRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/auth/me", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/v1/auth/me", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("mengembalikan profil user yang sedang login", async () => {
    const email = uniqueEmail("get-me");
    const user = await registerUser({
      name: "Get Me User",
      email,
      password: "password123",
      role: "RENTER",
    });
    mockGetServerSession.mockResolvedValue({ user: { id: user.id } });

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.email).toBe(email);
  });
});

describe("PATCH /api/v1/auth/me", () => {
  it("mengembalikan UNAUTHENTICATED 401 saat belum login", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const response = await PATCH(buildPatchRequest({ name: "Nama Baru" }));
    expect(response.status).toBe(401);
  });

  it("memperbarui nama dan nomor telepon profil (edit profil)", async () => {
    const email = uniqueEmail("patch-me");
    const user = await registerUser({
      name: "Nama Lama",
      email,
      password: "password123",
      role: "OWNER",
    });
    mockGetServerSession.mockResolvedValue({ user: { id: user.id } });

    const response = await PATCH(
      buildPatchRequest({ name: "Nama Baru", phone: "081200000000" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.name).toBe("Nama Baru");
    expect(body.data.phone).toBe("081200000000");
  });

  it("menolak body kosong dengan VALIDATION_ERROR 400", async () => {
    const email = uniqueEmail("patch-empty");
    const user = await registerUser({
      name: "Empty Body User",
      email,
      password: "password123",
      role: "OWNER",
    });
    mockGetServerSession.mockResolvedValue({ user: { id: user.id } });

    const response = await PATCH(buildPatchRequest({}));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("tidak menerima perubahan email lewat body (field tidak ada di schema)", async () => {
    const email = uniqueEmail("patch-no-email-change");
    const user = await registerUser({
      name: "No Email Change",
      email,
      password: "password123",
      role: "OWNER",
    });
    mockGetServerSession.mockResolvedValue({ user: { id: user.id } });

    const response = await PATCH(
      buildPatchRequest({ name: "Nama Update", email: "hacker@test.local" })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.email).toBe(email);
  });
});
