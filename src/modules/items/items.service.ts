import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { saveItemPhotoFile, validateItemPhotoFile } from "@/lib/upload";
import { Prisma } from "@/generated/prisma/client";
import type { ItemCondition, ItemStatus } from "@/generated/prisma/enums";

/** Thrown when an item lookup by id yields nothing (or it's soft-deleted where relevant). */
export class ItemNotFoundError extends Error {
  constructor(itemId: string) {
    super(`Item "${itemId}" not found.`);
    this.name = "ItemNotFoundError";
  }
}

/** Thrown when the acting user is not the owner of the item being mutated. */
export class ItemOwnershipError extends Error {
  constructor(itemId: string) {
    super(`Item "${itemId}" is not owned by the acting user.`);
    this.name = "ItemOwnershipError";
  }
}

export interface ItemPhotoDto {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ItemDto {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  category: string;
  condition: ItemCondition;
  pricePerDay: number;
  status: ItemStatus;
  createdAt: Date;
  updatedAt: Date;
  photos: ItemPhotoDto[];
}

/** `ItemDto` plus the item detail page's average rating (see `getItemById`). */
export interface ItemDetailDto extends ItemDto {
  ratingAverage: number | null;
}

type ItemWithPhotos = Prisma.ItemGetPayload<{ include: { photos: true } }>;

function toItemDto(item: ItemWithPhotos): ItemDto {
  return {
    id: item.id,
    ownerId: item.ownerId,
    name: item.name,
    description: item.description,
    category: item.category,
    condition: item.condition,
    pricePerDay: Number(item.pricePerDay),
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    photos: item.photos
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo) => ({
        id: photo.id,
        url: photo.url,
        isPrimary: photo.isPrimary,
        sortOrder: photo.sortOrder,
      })),
  };
}

export interface ListItemsFilter {
  category?: string;
  status?: ItemStatus;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc";
  page: number;
  limit: number;
}

export interface ListItemsResult {
  items: ItemDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * `GET /items` — public listing, filter by category/price range, status
 * defaults to `TERSEDIA` (docs/api-spec.md) unless explicitly overridden.
 */
export async function listItems(filter: ListItemsFilter): Promise<ListItemsResult> {
  const where = {
    status: filter.status ?? "TERSEDIA",
    ...(filter.category ? { category: filter.category } : {}),
    ...(filter.minPrice !== undefined || filter.maxPrice !== undefined
      ? {
          pricePerDay: {
            ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
            ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
          },
        }
      : {}),
  } as const;

  const orderBy =
    filter.sort === "price_asc"
      ? { pricePerDay: "asc" as const }
      : filter.sort === "price_desc"
        ? { pricePerDay: "desc" as const }
        : { createdAt: "desc" as const };

  const [total, items] = await prisma.$transaction([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      orderBy,
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      include: { photos: true },
    }),
  ]);

  return {
    items: items.map(toItemDto),
    pagination: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.max(Math.ceil(total / filter.limit), 1),
    },
  };
}

/**
 * `GET /items/:id` — public detail. Rating average is hardcoded to `null`
 * for now: it should come from `Review` records linked via `Booking -> Item`,
 * but `Booking`/`Review` models don't exist yet (Periode 8/14 — out of scope
 * for the Item module, see docs/todo/backend.md). Revisit once those models
 * land.
 */
export async function getItemById(itemId: string): Promise<ItemDetailDto | null> {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { photos: true },
  });

  if (!item) {
    return null;
  }

  return {
    ...toItemDto(item),
    ratingAverage: null,
  };
}

export interface CreateItemInput {
  name: string;
  description?: string | null;
  category: string;
  condition: ItemCondition;
  pricePerDay: number;
}

/**
 * `POST /items` — creates a new item owned by `ownerId`, saving each photo
 * to the local filesystem (`src/lib/upload.ts`) before writing the `Item` +
 * `ItemPhoto` rows in a single transaction (multi-table write, per
 * `.claude/rules/api-design.md`). The first photo is flagged `isPrimary`.
 */
export async function createItem(
  ownerId: string,
  input: CreateItemInput,
  photoFiles: File[]
): Promise<ItemDto> {
  // Validate every file up front so we don't partially write to disk on a
  // late validation failure.
  photoFiles.forEach(validateItemPhotoFile);

  const itemId = randomUUID();
  const savedPhotos: Array<{ url: string; filename: string }> = [];
  for (const file of photoFiles) {
    savedPhotos.push(await saveItemPhotoFile(itemId, file));
  }

  const item = await prisma.$transaction(async (tx) => {
    const createdItem = await tx.item.create({
      data: {
        id: itemId,
        ownerId,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        condition: input.condition,
        pricePerDay: input.pricePerDay,
      },
    });

    if (savedPhotos.length > 0) {
      await tx.itemPhoto.createMany({
        data: savedPhotos.map((photo, index) => ({
          itemId,
          url: photo.url,
          isPrimary: index === 0,
          sortOrder: index,
        })),
      });
    }

    return tx.item.findUniqueOrThrow({
      where: { id: createdItem.id },
      include: { photos: true },
    });
  });

  return toItemDto(item);
}

export interface UpdateItemInput {
  name?: string;
  description?: string | null;
  category?: string;
  condition?: ItemCondition;
  pricePerDay?: number;
}

/**
 * `PATCH /items/:id` — updates an item's own fields. Ownership is enforced
 * here (not just in the route/middleware layer), per
 * `.claude/rules/api-design.md`. Photo management (add/remove) is out of
 * scope for this endpoint for now — only `POST /items` accepts photo
 * uploads (assumption, not detailed further in docs/api-spec.md).
 */
export async function updateItem(
  itemId: string,
  ownerId: string,
  input: UpdateItemInput
): Promise<ItemDto> {
  const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
  if (!existingItem) {
    throw new ItemNotFoundError(itemId);
  }
  if (existingItem.ownerId !== ownerId) {
    throw new ItemOwnershipError(itemId);
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
      ...(input.pricePerDay !== undefined ? { pricePerDay: input.pricePerDay } : {}),
    },
    include: { photos: true },
  });

  return toItemDto(item);
}

/**
 * `DELETE /items/:id` — soft-delete: sets `status = NONAKTIF` rather than
 * removing the row, per `docs/database-design.md` §6.
 */
export async function deactivateItem(itemId: string, ownerId: string): Promise<ItemDto> {
  const existingItem = await prisma.item.findUnique({ where: { id: itemId } });
  if (!existingItem) {
    throw new ItemNotFoundError(itemId);
  }
  if (existingItem.ownerId !== ownerId) {
    throw new ItemOwnershipError(itemId);
  }

  const item = await prisma.item.update({
    where: { id: itemId },
    data: { status: "NONAKTIF" },
    include: { photos: true },
  });

  return toItemDto(item);
}
