import { afterAll, describe, expect, it } from "vitest";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import {
  EmailAlreadyRegisteredError,
  getUserProfile,
  registerUser,
  updateUserProfile,
  verifyCredentials,
} from "@/modules/auth/auth.service";

/**
 * Integration tests against the real test database (see .env.test /
 * vitest.setup.ts) — no Prisma mocking, per .claude/rules/testing.md.
 * Every user created here uses a unique `qa-auth-service-*` email so tests
 * stay independent, and rows are cleaned up in `afterAll`.
 */

const createdEmails: string[] = [];

function uniqueEmail(tag: string): string {
  const email = `qa-auth-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  createdEmails.push(email);
  return email;
}

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
});

describe("registerUser", () => {
  it("mendaftarkan Owner baru dengan password yang di-hash, bukan disimpan plain text", async () => {
    const email = uniqueEmail("register-owner");
    const user = await registerUser({
      name: "Owner Satu",
      email,
      password: "password123",
      role: "OWNER",
    });

    expect(user.role).toBe("OWNER");
    expect(user.email).toBe(email);

    const stored = await prisma.user.findUnique({ where: { email } });
    expect(stored?.passwordHash).not.toBe("password123");
    expect(await bcrypt.compare("password123", stored!.passwordHash)).toBe(true);
  });

  it("mendaftarkan Renter baru dengan role RENTER", async () => {
    const email = uniqueEmail("register-renter");
    const user = await registerUser({
      name: "Renter Satu",
      email,
      password: "password123",
      role: "RENTER",
    });

    expect(user.role).toBe("RENTER");
  });

  it("menormalisasi email ke lowercase saat registrasi", async () => {
    const rawEmail = `QA-Auth-Service-Case-${Date.now()}@Test.Local`;
    createdEmails.push(rawEmail.toLowerCase());
    const user = await registerUser({
      name: "Case Test",
      email: rawEmail,
      password: "password123",
      role: "OWNER",
    });

    expect(user.email).toBe(rawEmail.toLowerCase());
  });

  it("menolak registrasi dengan email yang sudah terdaftar (EmailAlreadyRegisteredError)", async () => {
    const email = uniqueEmail("duplicate");
    await registerUser({
      name: "Pengguna Pertama",
      email,
      password: "password123",
      role: "OWNER",
    });

    await expect(
      registerUser({
        name: "Pengguna Kedua",
        email,
        password: "password456",
        role: "RENTER",
      })
    ).rejects.toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});

describe("verifyCredentials", () => {
  it("mengembalikan user saat email dan password valid", async () => {
    const email = uniqueEmail("login-valid");
    await registerUser({
      name: "Login Valid",
      email,
      password: "password123",
      role: "RENTER",
    });

    const result = await verifyCredentials(email, "password123");
    expect(result).not.toBeNull();
    expect(result?.email).toBe(email);
    expect(result?.role).toBe("RENTER");
  });

  it("mengembalikan null saat password salah", async () => {
    const email = uniqueEmail("login-wrong-password");
    await registerUser({
      name: "Login Wrong Password",
      email,
      password: "password123",
      role: "RENTER",
    });

    const result = await verifyCredentials(email, "wrong-password");
    expect(result).toBeNull();
  });

  it("mengembalikan null saat email tidak terdaftar", async () => {
    const result = await verifyCredentials("tidak-ada@test.local", "password123");
    expect(result).toBeNull();
  });

  it("mengembalikan null saat akun sudah dinonaktifkan (isActive false)", async () => {
    const email = uniqueEmail("login-deactivated");
    const user = await registerUser({
      name: "Deactivated User",
      email,
      password: "password123",
      role: "OWNER",
    });
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });

    const result = await verifyCredentials(email, "password123");
    expect(result).toBeNull();
  });
});

describe("getUserProfile & updateUserProfile", () => {
  it("mengambil profil user berdasarkan id", async () => {
    const email = uniqueEmail("profile-get");
    const user = await registerUser({
      name: "Profile Get",
      email,
      password: "password123",
      role: "OWNER",
    });

    const profile = await getUserProfile(user.id);
    expect(profile?.email).toBe(email);
    expect(profile?.name).toBe("Profile Get");
  });

  it("mengembalikan null saat user id tidak ditemukan", async () => {
    const profile = await getUserProfile("00000000-0000-0000-0000-000000000000");
    expect(profile).toBeNull();
  });

  it("memperbarui nama dan nomor telepon user (edit profil)", async () => {
    const email = uniqueEmail("profile-update");
    const user = await registerUser({
      name: "Nama Lama",
      email,
      password: "password123",
      role: "RENTER",
    });

    const updated = await updateUserProfile(user.id, {
      name: "Nama Baru",
      phone: "081234567890",
    });

    expect(updated?.name).toBe("Nama Baru");
    expect(updated?.phone).toBe("081234567890");
  });

  it("tidak mengubah email/role lewat update profil karena field tsb tidak diterima input", async () => {
    const email = uniqueEmail("profile-immutable-fields");
    const user = await registerUser({
      name: "Immutable Test",
      email,
      password: "password123",
      role: "OWNER",
    });

    const updated = await updateUserProfile(user.id, { name: "Nama Diubah" });

    expect(updated?.email).toBe(email);
    expect(updated?.role).toBe("OWNER");
  });
});
