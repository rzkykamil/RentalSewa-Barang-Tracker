import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * E2E journey for the Auth module, following docs/flows/user-flow.md
 * (registration -> login -> role-appropriate dashboard -> edit profile).
 *
 * Runs against the already-running dev server (dev DB, not the test DB) —
 * every created user uses a `qa-auth-e2e-*` email so it's easy to identify
 * and clean up afterwards (see afterAll below). Cleanup uses a plain `pg`
 * client (not the generated Prisma client) since the generated client is
 * ESM-only and clashes with Playwright's CJS test transform.
 */

const createdEmails: string[] = [];

function uniqueEmail(tag: string): string {
  const email = `qa-auth-e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.local`;
  createdEmails.push(email);
  return email;
}

test.afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("DELETE FROM users WHERE email = ANY($1)", [createdEmails]);
  await client.end();
});

test.describe("Auth journey", () => {
  test("Owner: registrasi -> login -> dashboard Owner -> edit profil", async ({ page }) => {
    const email = uniqueEmail("owner");
    const password = "password123";

    await page.goto("/register");
    await page.getByLabel("Nama Lengkap").fill("QA Owner E2E");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata Sandi").fill(password);
    await page.getByLabel("Daftar sebagai").click();
    await page.getByRole("option", { name: "Pemilik Barang (Owner)" }).click();
    await page.getByRole("button", { name: "Daftar" }).click();

    await expect(page.getByText("Pendaftaran berhasil!")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata Sandi").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page).toHaveURL(/\/owner\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Selamat datang, QA Owner E2E" })).toBeVisible();

    // Role guard: Owner should be redirected away from the Renter dashboard.
    await page.goto("/renter/dashboard");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);

    // Edit profile.
    await page.goto("/owner/profile");
    const nameInput = page.getByLabel("Nama Lengkap");
    await nameInput.fill("QA Owner E2E Updated");
    await page.getByLabel("Nomor Telepon (opsional)").fill("081234500000");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();

    await expect(page.getByText("Profil berhasil diperbarui.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("Nama Lengkap")).toHaveValue("QA Owner E2E Updated");
  });

  test("Renter: registrasi -> login -> dashboard Renter, ditolak akses dashboard Owner", async ({ page }) => {
    const email = uniqueEmail("renter");
    const password = "password123";

    await page.goto("/register");
    await page.getByLabel("Nama Lengkap").fill("QA Renter E2E");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata Sandi").fill(password);
    await page.getByLabel("Daftar sebagai").click();
    await page.getByRole("option", { name: "Penyewa (Renter)" }).click();
    await page.getByRole("button", { name: "Daftar" }).click();

    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata Sandi").fill(password);
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page).toHaveURL(/\/renter\/dashboard$/);
    await expect(page.getByRole("heading", { name: "Selamat datang, QA Renter E2E" })).toBeVisible();

    // Role guard: Renter should be redirected away from the Owner dashboard.
    await page.goto("/owner/dashboard");
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/$/);
  });

  test("login ditolak dengan kredensial yang salah", async ({ page }) => {
    const email = uniqueEmail("bad-login");
    const password = "password123";

    await page.goto("/register");
    await page.getByLabel("Nama Lengkap").fill("QA Bad Login E2E");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata Sandi").fill(password);
    await page.getByLabel("Daftar sebagai").click();
    await page.getByRole("option", { name: "Penyewa (Renter)" }).click();
    await page.getByRole("button", { name: "Daftar" }).click();
    await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Kata Sandi").fill("wrong-password");
    await page.getByRole("button", { name: "Masuk" }).click();

    await expect(page.getByText("Email atau kata sandi salah.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("dashboard yang butuh login redirect ke /login saat belum login", async ({ page }) => {
    await page.goto("/owner/dashboard");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Fowner%2Fdashboard$/);
  });
});
