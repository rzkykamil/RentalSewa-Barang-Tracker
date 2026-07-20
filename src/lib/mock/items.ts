/**
 * Mock item (barang) data for the frontend-only phase (Periode 4 — see
 * docs/development-workflow.md). There is no real `items`/`item_photos`
 * table yet (prisma/schema.prisma has zero models) — pages read this
 * hardcoded array instead of calling an API. Shape mirrors the `items` and
 * `item_photos` tables planned in docs/database-design.md.
 *
 * Once the items backend module lands, this file should be replaced by
 * real API calls (see docs/api-spec.md) and can be deleted.
 */

import { MOCK_USERS } from "@/lib/mock/session";

/** Mirrors the `condition` enum planned in docs/database-design.md `items` table. */
export type MockItemCondition = "BAIK" | "CUKUP" | "RUSAK_RINGAN";

/** Mirrors the `status` enum planned in docs/database-design.md `items` table. */
export type MockItemStatus = "TERSEDIA" | "DISEWA" | "TELAT_KEMBALI" | "NONAKTIF";

export interface MockItemPhoto {
  id: string;
  itemId: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface MockItem {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  category: string;
  condition: MockItemCondition;
  pricePerDay: number;
  status: MockItemStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * A couple of additional mock owners (besides MOCK_USERS.OWNER) so the
 * Browse page reflects items from more than one lister, matching a real
 * marketplace inventory. These are plain display names only — not full
 * MockUser records — since only one owner account is "logged in" in this
 * phase.
 */
const OTHER_OWNERS = [
  { id: "mock-owner-2", name: "Dewi Lestari" },
  { id: "mock-owner-3", name: "Agus Wijaya" },
];

export const MOCK_CATEGORIES = [
  "Kamera & Fotografi",
  "Elektronik",
  "Alat Outdoor & Camping",
  "Perkakas",
  "Perlengkapan Pesta",
  "Kendaraan",
] as const;

export const MOCK_ITEMS: MockItem[] = [
  {
    id: "item-1",
    ownerId: MOCK_USERS.OWNER.id,
    ownerName: MOCK_USERS.OWNER.name,
    name: "Kamera Mirrorless Sony A7 III",
    description:
      "Kamera mirrorless full-frame, cocok untuk foto & video. Lengkap dengan baterai cadangan dan tas kamera.",
    category: "Kamera & Fotografi",
    condition: "BAIK",
    pricePerDay: 150000,
    status: "TERSEDIA",
    createdAt: "2026-05-01T08:00:00.000Z",
    updatedAt: "2026-05-01T08:00:00.000Z",
  },
  {
    id: "item-2",
    ownerId: MOCK_USERS.OWNER.id,
    ownerName: MOCK_USERS.OWNER.name,
    name: "Tenda Dome Kapasitas 4 Orang",
    description:
      "Tenda dome anti air untuk camping keluarga, mudah dipasang, sudah termasuk pasak dan tali.",
    category: "Alat Outdoor & Camping",
    condition: "CUKUP",
    pricePerDay: 45000,
    status: "DISEWA",
    createdAt: "2026-04-20T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z",
  },
  {
    id: "item-3",
    ownerId: MOCK_USERS.OWNER.id,
    ownerName: MOCK_USERS.OWNER.name,
    name: "Bor Listrik Makita",
    description:
      "Bor listrik serbaguna untuk kebutuhan renovasi rumah ringan. Termasuk satu set mata bor.",
    category: "Perkakas",
    condition: "BAIK",
    pricePerDay: 30000,
    status: "TELAT_KEMBALI",
    createdAt: "2026-03-15T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "item-4",
    ownerId: MOCK_USERS.OWNER.id,
    ownerName: MOCK_USERS.OWNER.name,
    name: "Proyektor Mini Portable",
    description:
      "Proyektor portable dengan koneksi HDMI & Bluetooth, cocok untuk nonton bareng atau presentasi.",
    category: "Elektronik",
    condition: "RUSAK_RINGAN",
    pricePerDay: 60000,
    status: "NONAKTIF",
    createdAt: "2026-02-10T08:00:00.000Z",
    updatedAt: "2026-05-20T08:00:00.000Z",
  },
  {
    id: "item-5",
    ownerId: OTHER_OWNERS[0].id,
    ownerName: OTHER_OWNERS[0].name,
    name: "Set Sound System Portable",
    description:
      "Speaker aktif 2 unit + mixer kecil, cocok untuk acara ulang tahun atau gathering kecil.",
    category: "Perlengkapan Pesta",
    condition: "BAIK",
    pricePerDay: 120000,
    status: "TERSEDIA",
    createdAt: "2026-05-18T08:00:00.000Z",
    updatedAt: "2026-05-18T08:00:00.000Z",
  },
  {
    id: "item-6",
    ownerId: OTHER_OWNERS[0].id,
    ownerName: OTHER_OWNERS[0].name,
    name: "Sepeda Gunung Polygon",
    description:
      "Sepeda gunung ukuran 27.5 inci, rem cakram hidrolik, siap dipakai untuk trek ringan-menengah.",
    category: "Kendaraan",
    condition: "CUKUP",
    pricePerDay: 50000,
    status: "TERSEDIA",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "item-7",
    ownerId: OTHER_OWNERS[1].id,
    ownerName: OTHER_OWNERS[1].name,
    name: "Drone DJI Mini 3",
    description:
      "Drone ringan dengan kamera 4K, cocok untuk konten video perjalanan. Termasuk 2 baterai tambahan.",
    category: "Kamera & Fotografi",
    condition: "BAIK",
    pricePerDay: 100000,
    status: "DISEWA",
    createdAt: "2026-04-05T08:00:00.000Z",
    updatedAt: "2026-06-15T08:00:00.000Z",
  },
  {
    id: "item-8",
    ownerId: OTHER_OWNERS[1].id,
    ownerName: OTHER_OWNERS[1].name,
    name: "Mesin Cuci Portable",
    description:
      "Mesin cuci portable kapasitas 5kg, cocok untuk kos-kosan atau kontrakan sementara.",
    category: "Elektronik",
    condition: "CUKUP",
    pricePerDay: 35000,
    status: "TERSEDIA",
    createdAt: "2026-06-05T08:00:00.000Z",
    updatedAt: "2026-06-05T08:00:00.000Z",
  },
];

/**
 * Photos per item, using deterministic picsum.photos seeds so the same
 * item always renders the same placeholder photos across page loads.
 */
export const MOCK_ITEM_PHOTOS: MockItemPhoto[] = MOCK_ITEMS.flatMap((item, itemIndex) =>
  Array.from({ length: itemIndex % 2 === 0 ? 3 : 2 }, (_, photoIndex) => ({
    id: `${item.id}-photo-${photoIndex + 1}`,
    itemId: item.id,
    url: `https://picsum.photos/seed/${item.id}-${photoIndex}/640/480`,
    isPrimary: photoIndex === 0,
    sortOrder: photoIndex,
  }))
);

export function getItemPhotos(itemId: string): MockItemPhoto[] {
  return MOCK_ITEM_PHOTOS.filter((photo) => photo.itemId === itemId).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

/** Mocked review, since Modul Rating/Review has not been built yet. */
export interface MockReview {
  id: string;
  itemId: string;
  renterName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "review-1",
    itemId: "item-1",
    renterName: "Siti Aminah",
    rating: 5,
    comment: "Kamera bersih dan hasil fotonya bagus, owner responsif.",
    createdAt: "2026-05-10T08:00:00.000Z",
  },
  {
    id: "review-2",
    itemId: "item-1",
    renterName: "Rian Hidayat",
    rating: 4,
    comment: "Sesuai deskripsi, hanya baterai agak cepat habis.",
    createdAt: "2026-05-20T08:00:00.000Z",
  },
  {
    id: "review-3",
    itemId: "item-5",
    renterName: "Siti Aminah",
    rating: 5,
    comment: "Suara jernih, cocok untuk acara kecil di rumah.",
    createdAt: "2026-05-25T08:00:00.000Z",
  },
  {
    id: "review-4",
    itemId: "item-6",
    renterName: "Budi Santoso",
    rating: 3,
    comment: "Sepeda oke, tapi rantai agak berisik.",
    createdAt: "2026-06-05T08:00:00.000Z",
  },
];

/** Aggregated rating for an item, or null if it has no reviews yet. */
export function getItemRating(itemId: string): { average: number; count: number } | null {
  const reviews = MOCK_REVIEWS.filter((review) => review.itemId === itemId);
  if (reviews.length === 0) return null;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: total / reviews.length, count: reviews.length };
}
