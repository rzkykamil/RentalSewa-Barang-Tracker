import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";

import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { UPLOAD_ROOT } from "@/lib/upload";
import {
  ItemNotFoundError,
  ItemOwnershipError,
  createItem,
  deactivateItem,
  getItemById,
  listItems,
  listItemsByOwner,
  updateItem,
} from "@/modules/items/items.service";

/**
 * Integration tests against the real test database (see .env.test /
 * vitest.setup.ts) — no Prisma mocking, per .claude/rules/testing.md.
 * Every user/item created here is tagged with a unique `qa-items-service-*`
 * marker so tests stay independent, and rows + uploaded files are cleaned
 * up in `afterAll`.
 */

const createdUserIds: string[] = [];

async function createOwner(tag: string) {
  const email = `qa-items-service-${tag}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: `Owner ${tag}`,
      email,
      passwordHash: "not-used-in-this-test",
      role: "OWNER",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

afterAll(async () => {
  await prisma.itemPhoto.deleteMany({ where: { item: { ownerId: { in: createdUserIds } } } });
  await prisma.item.deleteMany({ where: { ownerId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  // Best-effort cleanup of any files written by createItem's photo upload tests.
  await rm(UPLOAD_ROOT, { recursive: true, force: true }).catch(() => undefined);
});

function makeImageFile(name: string, mimeType = "image/jpeg"): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: mimeType });
}

describe("createItem", () => {
  it("membuat barang baru dengan status TERSEDIA dan menyimpan foto sebagai primary", async () => {
    const owner = await createOwner("create-basic");

    const item = await createItem(
      owner.id,
      {
        name: "Kamera Mirrorless",
        description: "Lengkap dengan lensa kit",
        category: "Kamera & Fotografi",
        condition: "BAIK",
        pricePerDay: 150000,
      },
      [makeImageFile("kamera.jpg")]
    );

    expect(item.ownerId).toBe(owner.id);
    expect(item.status).toBe("TERSEDIA");
    expect(item.photos).toHaveLength(1);
    expect(item.photos[0].isPrimary).toBe(true);
    expect(item.photos[0].url).toContain(item.id);
  });

  it("membuat barang tanpa foto (photos kosong diperbolehkan oleh service layer)", async () => {
    const owner = await createOwner("create-no-photo");

    const item = await createItem(
      owner.id,
      {
        name: "Bor Listrik",
        category: "Perkakas",
        condition: "CUKUP",
        pricePerDay: 25000,
      },
      []
    );

    expect(item.photos).toHaveLength(0);
  });

  it("menandai foto pertama sebagai primary dan sisanya mengikuti urutan upload", async () => {
    const owner = await createOwner("create-multi-photo");

    const item = await createItem(
      owner.id,
      {
        name: "Tenda Camping",
        category: "Alat Outdoor & Camping",
        condition: "BAIK",
        pricePerDay: 40000,
      },
      [makeImageFile("tenda-1.jpg"), makeImageFile("tenda-2.png", "image/png")]
    );

    expect(item.photos).toHaveLength(2);
    const sorted = [...item.photos].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0].isPrimary).toBe(true);
    expect(sorted[1].isPrimary).toBe(false);
  });

  it("menolak foto dengan tipe file yang tidak didukung", async () => {
    const owner = await createOwner("create-invalid-type");

    await expect(
      createItem(
        owner.id,
        {
          name: "Barang Rusak Tipe",
          category: "Elektronik",
          condition: "BAIK",
          pricePerDay: 10000,
        },
        [makeImageFile("dokumen.pdf", "application/pdf")]
      )
    ).rejects.toThrow();
  });
});

describe("listItems", () => {
  it("default hanya menampilkan barang berstatus TERSEDIA di listing publik (FR3)", async () => {
    const owner = await createOwner("list-default-status");
    const available = await createItem(
      owner.id,
      { name: "Barang Tersedia", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );
    const inactive = await createItem(
      owner.id,
      { name: "Barang Nonaktif", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );
    await deactivateItem(inactive.id, owner.id);

    const result = await listItems({ page: 1, limit: 50 });
    const ids = result.items.map((item) => item.id);
    expect(ids).toContain(available.id);
    expect(ids).not.toContain(inactive.id);
  });

  it("memfilter barang berdasarkan kategori", async () => {
    const owner = await createOwner("list-category");
    const uniqueCategory = `QA-Kategori-${Date.now()}`;
    const matching = await createItem(
      owner.id,
      { name: "Barang Kategori A", category: uniqueCategory, condition: "BAIK", pricePerDay: 10000 },
      []
    );
    await createItem(
      owner.id,
      { name: "Barang Kategori B", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );

    const result = await listItems({ category: uniqueCategory, page: 1, limit: 50 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(matching.id);
  });

  it("memfilter barang berdasarkan rentang harga (minPrice & maxPrice)", async () => {
    const owner = await createOwner("list-price-range");
    const uniqueCategory = `QA-Harga-${Date.now()}`;
    const cheap = await createItem(
      owner.id,
      { name: "Barang Murah", category: uniqueCategory, condition: "BAIK", pricePerDay: 5000 },
      []
    );
    const mid = await createItem(
      owner.id,
      { name: "Barang Sedang", category: uniqueCategory, condition: "BAIK", pricePerDay: 15000 },
      []
    );
    const expensive = await createItem(
      owner.id,
      { name: "Barang Mahal", category: uniqueCategory, condition: "BAIK", pricePerDay: 50000 },
      []
    );

    const result = await listItems({
      category: uniqueCategory,
      minPrice: 10000,
      maxPrice: 20000,
      page: 1,
      limit: 50,
    });

    const ids = result.items.map((item) => item.id);
    expect(ids).toContain(mid.id);
    expect(ids).not.toContain(cheap.id);
    expect(ids).not.toContain(expensive.id);
  });

  it("mengurutkan barang berdasarkan harga ascending (price_asc)", async () => {
    const owner = await createOwner("list-sort-asc");
    const uniqueCategory = `QA-Sort-Asc-${Date.now()}`;
    const high = await createItem(
      owner.id,
      { name: "Barang Sort A", category: uniqueCategory, condition: "BAIK", pricePerDay: 30000 },
      []
    );
    const low = await createItem(
      owner.id,
      { name: "Barang Sort B", category: uniqueCategory, condition: "BAIK", pricePerDay: 10000 },
      []
    );

    const result = await listItems({ category: uniqueCategory, sort: "price_asc", page: 1, limit: 50 });
    const ids = result.items.map((item) => item.id);
    expect(ids.indexOf(low.id)).toBeLessThan(ids.indexOf(high.id));
  });

  it("mengurutkan barang berdasarkan harga descending (price_desc)", async () => {
    const owner = await createOwner("list-sort-desc");
    const uniqueCategory = `QA-Sort-Desc-${Date.now()}`;
    const high = await createItem(
      owner.id,
      { name: "Barang Sort C", category: uniqueCategory, condition: "BAIK", pricePerDay: 30000 },
      []
    );
    const low = await createItem(
      owner.id,
      { name: "Barang Sort D", category: uniqueCategory, condition: "BAIK", pricePerDay: 10000 },
      []
    );

    const result = await listItems({ category: uniqueCategory, sort: "price_desc", page: 1, limit: 50 });
    const ids = result.items.map((item) => item.id);
    expect(ids.indexOf(high.id)).toBeLessThan(ids.indexOf(low.id));
  });

  it("mem-paginasi hasil sesuai page & limit", async () => {
    const owner = await createOwner("list-pagination");
    const uniqueCategory = `QA-Pagination-${Date.now()}`;
    for (let i = 0; i < 3; i += 1) {
      await createItem(
        owner.id,
        { name: `Barang Page ${i}`, category: uniqueCategory, condition: "BAIK", pricePerDay: 10000 },
        []
      );
    }

    const firstPage = await listItems({ category: uniqueCategory, page: 1, limit: 2 });
    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.pagination.total).toBe(3);
    expect(firstPage.pagination.totalPages).toBe(2);

    const secondPage = await listItems({ category: uniqueCategory, page: 2, limit: 2 });
    expect(secondPage.items).toHaveLength(1);
  });
});

describe("listItemsByOwner", () => {
  it("menampilkan seluruh barang milik owner termasuk yang berstatus non-TERSEDIA", async () => {
    const owner = await createOwner("list-by-owner");
    const active = await createItem(
      owner.id,
      { name: "Owner Item Aktif", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );
    const deactivated = await createItem(
      owner.id,
      { name: "Owner Item Nonaktif", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );
    await deactivateItem(deactivated.id, owner.id);

    const items = await listItemsByOwner(owner.id);
    const ids = items.map((item) => item.id);
    expect(ids).toContain(active.id);
    expect(ids).toContain(deactivated.id);
  });
});

describe("getItemById", () => {
  it("mengembalikan detail barang beserta ratingAverage (saat ini selalu null, lihat docs/todo/backend.md Backlog)", async () => {
    const owner = await createOwner("get-by-id");
    const item = await createItem(
      owner.id,
      { name: "Barang Detail", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );

    const detail = await getItemById(item.id);
    expect(detail?.id).toBe(item.id);
    expect(detail?.ratingAverage).toBeNull();
  });

  it("mengembalikan null saat barang tidak ditemukan", async () => {
    const detail = await getItemById(randomUUID());
    expect(detail).toBeNull();
  });
});

describe("updateItem", () => {
  it("memperbarui field barang milik sendiri", async () => {
    const owner = await createOwner("update-own");
    const item = await createItem(
      owner.id,
      { name: "Nama Lama", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );

    const updated = await updateItem(item.id, owner.id, {
      name: "Nama Baru",
      pricePerDay: 20000,
    });

    expect(updated.name).toBe("Nama Baru");
    expect(updated.pricePerDay).toBe(20000);
  });

  it("melempar ItemNotFoundError saat barang tidak ditemukan", async () => {
    const owner = await createOwner("update-not-found");

    await expect(updateItem(randomUUID(), owner.id, { name: "X" })).rejects.toBeInstanceOf(
      ItemNotFoundError
    );
  });

  it("melempar ItemOwnershipError saat mengubah barang milik owner lain", async () => {
    const owner = await createOwner("update-owner-a");
    const otherOwner = await createOwner("update-owner-b");
    const item = await createItem(
      owner.id,
      { name: "Barang Owner A", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );

    await expect(
      updateItem(item.id, otherOwner.id, { name: "Diretas" })
    ).rejects.toBeInstanceOf(ItemOwnershipError);
  });
});

describe("deactivateItem", () => {
  it("mengubah status barang menjadi NONAKTIF", async () => {
    const owner = await createOwner("deactivate-own");
    const item = await createItem(
      owner.id,
      { name: "Barang Akan Dinonaktifkan", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );

    const deactivated = await deactivateItem(item.id, owner.id);
    expect(deactivated.status).toBe("NONAKTIF");
  });

  it("barang yang dinonaktifkan tidak lagi muncul di listing publik default", async () => {
    const owner = await createOwner("deactivate-hidden");
    const item = await createItem(
      owner.id,
      { name: "Barang Hilang Dari Listing", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );
    await deactivateItem(item.id, owner.id);

    const result = await listItems({ page: 1, limit: 100 });
    expect(result.items.map((i) => i.id)).not.toContain(item.id);
  });

  it("melempar ItemNotFoundError saat barang tidak ditemukan", async () => {
    const owner = await createOwner("deactivate-not-found");

    await expect(deactivateItem(randomUUID(), owner.id)).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  it("melempar ItemOwnershipError saat menonaktifkan barang milik owner lain", async () => {
    const owner = await createOwner("deactivate-owner-a");
    const otherOwner = await createOwner("deactivate-owner-b");
    const item = await createItem(
      owner.id,
      { name: "Barang Owner A2", category: "Elektronik", condition: "BAIK", pricePerDay: 10000 },
      []
    );

    await expect(deactivateItem(item.id, otherOwner.id)).rejects.toBeInstanceOf(ItemOwnershipError);
  });
});
