import type { Metadata } from "next";

import { AdminItemsTable } from "@/components/admin/AdminItemsTable";
import { adminItemsCopy } from "@/lib/copy/admin";
import { MOCK_ITEMS } from "@/lib/mock/items";

export const metadata: Metadata = {
  title: "Kelola Barang — Rental Sewa Barang Tracker",
};

export default function AdminItemsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{adminItemsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{adminItemsCopy.subtitle}</p>
      </div>

      <AdminItemsTable initialItems={MOCK_ITEMS} />
    </div>
  );
}
