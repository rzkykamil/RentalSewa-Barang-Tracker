import { randomUUID } from "node:crypto";

import { test, expect } from "@playwright/test";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env.local" });

/**
 * E2E happy-path journey for the Booking module, following
 * docs/flows/user-flow.md (Renter: ajukan sewa -> Owner: approve -> aktif ->
 * selesai). Runs against the already-running dev server (dev DB, not the
 * test DB) — every created user uses a `qa-bookings-e2e-*` email and every
 * item name is prefixed `QA Booking E2E` so it's easy to identify and clean
 * up afterwards (see afterAll below). Cleanup uses a plain `pg` client (not
 * the generated Prisma client) since the generated client is ESM-only and
 * clashes with Playwright's CJS test transform — same pattern as
 * `e2e/item-flow.spec.ts`.
 *
 * Owner and Renter act in the same journey, so this test uses two separate
 * browser contexts (one per role) instead of logging in/out on a single
 * page.
 */

const createdEmails: string[] = [];
const ITEM_NAME_PREFIX = "QA Booking E2E";

function uniqueEmail(tag: string): string {
  const email = `qa-bookings-e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.local`;
  createdEmails.push(email);
  return email;
}

test.afterAll(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(
    `DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE item_id IN (SELECT id FROM items WHERE name LIKE $1))`,
    [`${ITEM_NAME_PREFIX}%`]
  );
  await client.query(
    `DELETE FROM bookings WHERE item_id IN (SELECT id FROM items WHERE name LIKE $1)`,
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

function dateString(daysFromNow: number): string {
  const now = new Date();
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  base.setUTCDate(base.getUTCDate() + daysFromNow);
  return base.toISOString().slice(0, 10);
}

test.describe("Booking journey (request -> approve -> aktif -> selesai)", () => {
  test("Renter mengajukan sewa, Owner approve -> tandai aktif -> tandai selesai", async ({ browser }) => {
    const ownerContext = await browser.newContext();
    const renterContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();
    const renterPage = await renterContext.newPage();

    try {
      // Prepare an available item directly via DB (Owner CRUD + upload already
      // covered by e2e/item-flow.spec.ts) so this test stays focused on the
      // booking status machine journey itself.
      const itemName = `${ITEM_NAME_PREFIX} ${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const ownerEmail = uniqueEmail("owner");
      const itemId = randomUUID();
      const pricePerDay = 50000;

      // Register the Owner through the UI (so the password hash + session
      // work normally), then create the item directly via DB tied to that
      // Owner's real id — Owner CRUD + photo upload is already covered by
      // e2e/item-flow.spec.ts, so this test stays focused on the booking
      // status machine journey itself.
      await registerAndLogin(ownerPage, "Owner", "QA Owner Booking E2E", ownerEmail);

      const setupClient = new Client({ connectionString: process.env.DATABASE_URL });
      await setupClient.connect();
      const { rows } = await setupClient.query("SELECT id FROM users WHERE email = $1", [ownerEmail]);
      const realOwnerId = rows[0].id as string;
      await setupClient.query(
        `INSERT INTO items (id, owner_id, name, category, condition, price_per_day, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'Elektronik', 'BAIK', $4, 'TERSEDIA', now(), now())`,
        [itemId, realOwnerId, itemName, pricePerDay]
      );
      await setupClient.end();

      // Renter: ajukan sewa (request).
      const renterEmail = uniqueEmail("renter");
      await registerAndLogin(renterPage, "Renter", "QA Renter Booking E2E", renterEmail);

      await renterPage.goto(`/renter/browse/${itemId}/request`);
      await renterPage.getByLabel("Tanggal Mulai").fill(dateString(1));
      await renterPage.getByLabel("Tanggal Selesai").fill(dateString(3));
      await renterPage.getByRole("button", { name: "Ajukan Sewa" }).click();
      await expect(
        renterPage.getByText("Permintaan sewa berhasil diajukan. Menunggu persetujuan pemilik.")
      ).toBeVisible();
      await expect(renterPage).toHaveURL(/\/renter\/bookings$/, { timeout: 5000 });

      // Status badges use `data-slot="badge"` — targeted explicitly (instead
      // of a plain text match) because the Renter card also renders a
      // `BookingTimeline` whose step labels ("Disetujui", "Selesai") overlap
      // with the badge's own status labels.
      const renterCard = renterPage.locator('[data-slot="card"]').filter({ hasText: itemName });
      const renterBadge = renterCard.locator('[data-slot="badge"]').first();
      await expect(renterBadge).toHaveText("Menunggu Persetujuan");

      // Owner: lihat request masuk -> approve.
      await ownerPage.goto("/owner/bookings");
      const ownerCard = ownerPage.locator('[data-slot="card"]').filter({ hasText: itemName });
      const ownerBadge = ownerCard.locator('[data-slot="badge"]').first();
      await expect(ownerBadge).toHaveText("Menunggu Persetujuan");

      await ownerCard.getByRole("button", { name: "Setujui" }).click();
      await ownerPage.getByRole("button", { name: "Ya, Setujui" }).click();
      await expect(ownerPage.getByText("Request berhasil disetujui.")).toBeVisible();
      await expect(ownerBadge).toHaveText("Disetujui");

      // Renter: booking berubah jadi APPROVED.
      await renterPage.goto("/renter/bookings");
      await expect(renterBadge).toHaveText("Disetujui");

      // Owner: tandai aktif (handover barang).
      await ownerCard.getByRole("button", { name: "Tandai Aktif" }).click();
      await ownerPage.getByRole("button", { name: "Ya, Tandai Aktif" }).click();
      await expect(ownerPage.getByText("Booking ditandai aktif.")).toBeVisible();
      await expect(ownerBadge).toHaveText("Sedang Berjalan");

      // Renter: booking berubah jadi ACTIVE.
      await renterPage.goto("/renter/bookings");
      await expect(renterBadge).toHaveText("Sedang Berjalan");

      // Owner: tandai selesai (barang dikembalikan).
      await ownerCard.getByRole("button", { name: "Tandai Selesai" }).click();
      await ownerPage.getByRole("button", { name: "Ya, Tandai Selesai" }).click();
      await expect(ownerPage.getByText("Booking ditandai selesai.")).toBeVisible();
      await expect(ownerBadge).toHaveText("Selesai");

      // Renter: booking berubah jadi COMPLETED.
      await renterPage.goto("/renter/bookings");
      await expect(renterBadge).toHaveText("Selesai");
    } finally {
      await ownerContext.close();
      await renterContext.close();
    }
  });
});
