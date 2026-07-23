-- CreateEnum
CREATE TYPE "ItemCondition" AS ENUM ('BAIK', 'CUKUP', 'RUSAK_RINGAN');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('TERSEDIA', 'DISEWA', 'TELAT_KEMBALI', 'NONAKTIF');

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(80) NOT NULL,
    "condition" "ItemCondition" NOT NULL,
    "price_per_day" DECIMAL(12,2) NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'TERSEDIA',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_photos" (
    "id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "items_owner_id_idx" ON "items"("owner_id");

-- CreateIndex
CREATE INDEX "items_category_idx" ON "items"("category");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "item_photos_item_id_idx" ON "item_photos"("item_id");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_photos" ADD CONSTRAINT "item_photos_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
