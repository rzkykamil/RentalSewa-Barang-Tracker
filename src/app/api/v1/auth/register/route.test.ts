import { afterAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/v1/auth/register/route";

/**
 * Integration test for `POST /api/v1/auth/register` against the real test
 * database — exercises Zod validation + service layer + response envelope
 * shape together, per .claude/rules/testing.md.
 */

const createdEmails: string[] = [];

function uniqueEmail(tag: string): string {
  const email = `qa-auth-register-route-${tag}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}@test.local`;
  createdEmails.push(email);
  return email;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
});

function buildRequest(body: unknown, ip = "127.0.0.1"): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/v1/auth/register", () => {
  it("mendaftarkan Owner baru dan mengembalikan status 201 dengan envelope { data }", async () => {
    const email = uniqueEmail("owner");
    const response = await POST(
      buildRequest({
        name: "Owner Baru",
        email,
        password: "password123",
        role: "OWNER",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.email).toBe(email);
    expect(body.data.role).toBe("OWNER");
    expect(body.data.passwordHash).toBeUndefined();
  });

  it("mendaftarkan Renter baru", async () => {
    const email = uniqueEmail("renter");
    const response = await POST(
      buildRequest({
        name: "Renter Baru",
        email,
        password: "password123",
        role: "RENTER",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data.role).toBe("RENTER");
  });

  it("menolak input tidak valid (email salah format) dengan VALIDATION_ERROR 400", async () => {
    const response = await POST(
      buildRequest({
        name: "Invalid Email",
        email: "bukan-email",
        password: "password123",
        role: "OWNER",
      }, "127.0.0.2")
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak password kurang dari 8 karakter", async () => {
    const response = await POST(
      buildRequest({
        name: "Short Password",
        email: uniqueEmail("short-pw"),
        password: "short",
        role: "OWNER",
      }, "127.0.0.3")
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak role ADMIN pada endpoint registrasi publik", async () => {
    const response = await POST(
      buildRequest({
        name: "Sneaky Admin",
        email: uniqueEmail("admin-attempt"),
        password: "password123",
        role: "ADMIN",
      }, "127.0.0.4")
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("menolak registrasi dengan email yang sudah terdaftar (CONFLICT 409)", async () => {
    const email = uniqueEmail("conflict");
    const ip = "127.0.0.5";
    await POST(buildRequest({ name: "Pertama", email, password: "password123", role: "OWNER" }, ip));

    const response = await POST(
      buildRequest({ name: "Kedua", email, password: "password456", role: "RENTER" }, "127.0.0.6")
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("CONFLICT");
  });

  it("membatasi percobaan registrasi ke 5 per menit per IP (rate limit)", async () => {
    const ip = `127.10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    for (let i = 0; i < 5; i += 1) {
      const response = await POST(
        buildRequest(
          { name: `Rate Limit ${i}`, email: uniqueEmail(`rate-limit-${i}`), password: "password123", role: "OWNER" },
          ip
        )
      );
      expect(response.status).not.toBe(429);
    }

    const sixthResponse = await POST(
      buildRequest(
        { name: "Rate Limit 6", email: uniqueEmail("rate-limit-6"), password: "password123", role: "OWNER" },
        ip
      )
    );

    expect(sixthResponse.status).toBe(429);
    const body = await sixthResponse.json();
    expect(body.error.code).toBe("RATE_LIMITED");
  });
});
