/**
 * Static category list for the Browse & Discovery filter dropdown.
 *
 * There is no backend "categories" endpoint (`docs/api-spec.md`) — `Item.category`
 * is a free-text field, validated server-side only for length
 * (`src/app/api/v1/items/route.ts`). This list is a curated set of common
 * categories for the filter UI only; it does not constrain what an Owner can
 * type into the "Kategori" field on the item form.
 */
export const ITEM_CATEGORIES = [
  "Kamera & Fotografi",
  "Elektronik",
  "Alat Outdoor & Camping",
  "Perkakas",
  "Perlengkapan Pesta",
  "Kendaraan",
] as const;
