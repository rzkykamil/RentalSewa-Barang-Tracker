import type { Metadata } from "next";

import { ItemForm } from "@/components/items/ItemForm";
import { itemFormCopy } from "@/lib/copy/items";

export const metadata: Metadata = {
  title: "Tambah Barang — Rental Sewa Barang Tracker",
};

export default function NewOwnerItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{itemFormCopy.createTitle}</h1>
        <p className="text-sm text-muted-foreground">{itemFormCopy.createSubtitle}</p>
      </div>
      <ItemForm mode="create" />
    </div>
  );
}
