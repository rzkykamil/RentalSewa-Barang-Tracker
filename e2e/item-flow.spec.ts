import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * E2E journey for the Barang (Item) module, following docs/flows/user-flow.md
 * (Owner: tambah barang -> barang muncul di listing publik; Renter: browse &
 * filter -> lihat detail barang, termasuk rating & tombol ajukan sewa).
 *
 * Runs against the already-running dev server (dev DB, not the test DB) —
 * every created user uses a `qa-items-e2e-*` email, and every item name is
 * prefixed `QA Item E2E` so it's easy to identify and clean up afterwards
 * (see afterAll below). Cleanup uses a plain `pg` client (not the generated
 * Prisma client) since the generated client is ESM-only and clashes with
 * Playwright's CJS test transform — same pattern as `e2e/auth-flow.spec.ts`.
 */

const createdEmails: string[] = [];
const ITEM_NAME_PREFIX = "QA Item E2E";

function uniqueEmail(tag: string): string {
  const email = `qa-items-e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.local`;
  createdEmails.push(email);
  return email;
}

function uniqueItemName(tag: string): string {
  return `${ITEM_NAME_PREFIX} ${tag} ${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

test.afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `DELETE FROM item_photos WHERE item_id IN (SELECT id FROM items WHERE name LIKE $1)`,
    [`${ITEM_NAME_PREFIX}%`]
  );
  await client.query(`DELETE FROM items WHERE name LIKE $1`, [`${ITEM_NAME_PREFIX}%`]);
  await client.query("DELETE FROM users WHERE email = ANY($1)", [createdEmails]);
  await client.end();
});

async function registerAndLogin(
  page: import("@playwright/test").Page,
  role: "Owner" | "Renter",
  name: string,
  email: string,
  password = "password123"
) {
  await page.goto("/register");
  await page.getByLabel("Nama Lengkap").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByLabel("Daftar sebagai").click();
  await page
    .getByRole("option", { name: role === "Owner" ? "Pemilik Barang (Owner)" : "Penyewa (Renter)" })
    .click();
  await page.getByRole("button", { name: "Daftar" }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 5000 });

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Kata Sandi").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(role === "Owner" ? /\/owner\/dashboard$/ : /\/renter\/dashboard$/);
}

// Run serially (not in a separate Playwright worker per test): both tests
// hit the same dev server + dev DB, and one of them exercises the heaviest
// path in the module (multipart photo upload + multiple sequential
// mutations). Under this sandbox's limited resources, running them fully in
// parallel across workers was observed to occasionally produce spurious
// "not found" responses purely from dev-server/DB contention, not from a
// real product bug (each test passes reliably in isolation). Serial mode
// avoids that resource contention without weakening what's asserted.
test.describe.configure({ mode: "serial" });

test.describe("Item (Barang) journey", () => {
  test("Owner: tambah barang dengan foto -> edit -> nonaktifkan", async ({ page }) => {
    const ownerEmail = uniqueEmail("owner-crud");
    await registerAndLogin(page, "Owner", "QA Owner Items", ownerEmail);

    const itemName = uniqueItemName("CRUD");

    // Tambah barang (create), termasuk upload foto.
    await page.goto("/owner/items/new");
    await page.getByLabel("Nama Barang").fill(itemName);
    await page.getByLabel("Deskripsi").fill("Barang uji QA, jangan dihapus manual.");
    await page.getByLabel("Kategori").fill("Elektronik");
    await page.getByLabel("Kondisi Barang").click();
    await page.getByRole("option", { name: "Baik" }).click();
    await page.getByLabel("Harga Sewa per Hari (Rp)").fill("50000");
    await page.getByLabel("Unggah foto barang").setInputFiles({
      name: "qa-item-photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x01, 0x02, 0x03]),
    });
    await page.getByRole("button", { name: "Simpan Barang" }).click();

    await expect(page.getByText("Barang berhasil ditambahkan.")).toBeVisible();
    await expect(page).toHaveURL(/\/owner\/items\/(?!new$)[^/]+$/, { timeout: 5000 });
    await expect(page.getByRole("heading", { name: itemName })).toBeVisible();

    // Muncul di daftar "Barang Saya" dengan status Tersedia.
    await page.goto("/owner/items");
    const row = page.getByRole("row", { name: new RegExp(itemName) });
    await expect(row).toBeVisible();
    await expect(row.getByText("Tersedia")).toBeVisible();

    // Edit barang.
    await row.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/owner\/items\/[^/]+\/edit$/);
    const updatedName = `${itemName} (Updated)`;
    await page.getByLabel("Nama Barang").fill(updatedName);
    await page.getByLabel("Harga Sewa per Hari (Rp)").fill("75000");
    await page.getByRole("button", { name: "Simpan Perubahan" }).click();
    await expect(page.getByText("Perubahan berhasil disimpan.")).toBeVisible();

    // Nonaktifkan barang.
    await page.goto("/owner/items");
    const updatedRow = page.getByRole("row", { name: new RegExp(updatedName.replace(/[()]/g, "\\$&")) });
    await updatedRow.getByRole("link", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Nonaktifkan Barang" }).click();
    await page.getByRole("button", { name: "Ya, Nonaktifkan" }).click();
    await expect(page.getByText("Barang berhasil dinonaktifkan.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Barang Nonaktif" })).toBeDisabled();

    // Barang nonaktif tidak lagi muncul di daftar "Barang Saya" dengan status Tersedia.
    await page.goto("/owner/items");
    await expect(page.getByRole("row", { name: new RegExp(updatedName.replace(/[()]/g, "\\$&")) }).getByText("Nonaktif")).toBeVisible();
  });

  test("Renter: browse & filter barang -> lihat detail (rating & tombol ajukan sewa)", async ({ page }) => {
    // Owner + barang tersedia disiapkan langsung lewat DB (bukan lewat form
    // UI) — alur "tambah barang lewat form, termasuk upload foto" sudah
    // dicakup penuh oleh test "Owner: tambah barang..." di atas. Menyiapkan
    // data lewat SQL di sini menjaga test ini fokus pada journey Renter
    // (Browse & Discovery + detail barang) sesuai cakupannya, dan lebih
    // stabil dijalankan berbarengan dengan test lain (form + upload foto
    // via UI, dijalankan di worker terpisah, cukup berat untuk dev server).
    const itemName = uniqueItemName("Browse");
    const category = "Alat Outdoor & Camping";
    const ownerEmail = uniqueEmail("owner-browse");
    const ownerId = randomUUID();
    const itemId = randomUUID();

    const setupClient = new Client({ connectionString: process.env.DATABASE_URL });
    await setupClient.connect();
    createdEmails.push(ownerEmail);
    await setupClient.query(
      `INSERT INTO users (id, name, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'not-used-in-e2e', 'OWNER', true, now(), now())`,
      [ownerId, "QA Owner Browse Source", ownerEmail]
    );
    await setupClient.query(
      `INSERT INTO items (id, owner_id, name, category, condition, price_per_day, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'BAIK', 120000, 'TERSEDIA', now(), now())`,
      [itemId, ownerId, itemName, category]
    );
    await setupClient.end();

    // Renter menjelajah & memfilter barang.
    const renterEmail = uniqueEmail("renter-browse");
    await registerAndLogin(page, "Renter", "QA Renter Browse", renterEmail);

    await page.goto("/renter/browse");
    await page.getByLabel("Kategori").click();
    await page.getByRole("option", { name: category }).click();
    await expect(page).toHaveURL(/category=Alat\+Outdoor\+%26\+Camping/);

    await page.getByLabel("Harga Minimum").fill("100000");
    await page.getByLabel("Harga Maksimum").fill("150000");
    await page.getByRole("button", { name: "Terapkan Rentang Harga" }).click();
    await expect(page).toHaveURL(/minPrice=100000/);

    await page.getByLabel("Urutkan").click();
    await page.getByRole("option", { name: "Harga Tertinggi" }).click();
    await expect(page).toHaveURL(/sort=price_desc/);

    const card = page.getByRole("link", { name: new RegExp(itemName) });
    await expect(card).toBeVisible();

    // Rentang harga yang tidak mencakup barang tsb menyembunyikannya.
    await page.getByLabel("Harga Minimum").fill("1");
    await page.getByLabel("Harga Maksimum").fill("2");
    await page.getByRole("button", { name: "Terapkan Rentang Harga" }).click();
    await expect(page.getByRole("link", { name: new RegExp(itemName) })).toHaveCount(0);

    // Kembali ke rentang yang mencakup barang, lalu buka detail.
    await page.getByLabel("Harga Minimum").fill("");
    await page.getByLabel("Harga Maksimum").fill("");
    await page.getByRole("button", { name: "Terapkan Rentang Harga" }).click();
    await page.getByRole("link", { name: new RegExp(itemName) }).click();

    await expect(page).toHaveURL(/\/renter\/browse\/[^/]+$/);
    await expect(page.getByRole("heading", { name: itemName })).toBeVisible();
    // Belum ada review untuk barang baru — rating menampilkan pesan kosong, bukan angka.
    await expect(page.getByText("Belum ada ulasan").first()).toBeVisible();
    // Barang berstatus TERSEDIA -> tombol ajukan sewa aktif dan mengarah ke form request.
    const requestButton = page.getByRole("link", { name: "Ajukan Sewa" });
    await expect(requestButton).toBeVisible();
    await expect(requestButton).toBeEnabled();
    await requestButton.click();
    await expect(page).toHaveURL(/\/renter\/browse\/[^/]+\/request$/);
  });
});
