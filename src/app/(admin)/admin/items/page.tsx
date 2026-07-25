import type { Metadata } from "next";

import { AdminItemsTable } from "@/components/admin/AdminItemsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { adminItemsCopy } from "@/lib/copy/admin";
import { listItemsForAdmin, type AdminItemDto } from "@/modules/admin/admin.service";

export const metadata: Metadata = {
  title: "Kelola Barang — Rental Sewa Barang Tracker",
};

export default async function AdminItemsPage() {
  let items: AdminItemDto[] = [];
  let loadError = false;
  try {
    const result = await listItemsForAdmin({ page: 1, limit: 100 });
    items = result.items;
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{adminItemsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{adminItemsCopy.subtitle}</p>
      </div>

      {loadError ? (
        <EmptyState
          title="Gagal memuat barang"
          description="Terjadi kesalahan saat mengambil daftar barang. Coba muat ulang halaman."
        />
      ) : (
        <AdminItemsTable initialItems={items} />
      )}
    </div>
  );
}
