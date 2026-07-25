import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OwnerItemEditForm } from "@/components/items/OwnerItemEditForm";
import { itemFormCopy } from "@/lib/copy/items";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getItemById } from "@/modules/items/items.service";

export const metadata: Metadata = {
  title: "Edit Barang — Rental Sewa Barang Tracker",
};

interface OwnerItemEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerItemEditPage({ params }: OwnerItemEditPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const item = await getItemById(id);

  // Only the owning Owner may edit this item — matches the permission
  // matrix in docs/prd.md §7. Ownership is also re-checked server-side by
  // `updateItem`/`deactivateItem` (see .claude/rules/api-design.md), this is
  // just the page-level guard.
  if (!item || item.ownerId !== user.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{itemFormCopy.editTitle}</h1>
        <p className="text-sm text-muted-foreground">{itemFormCopy.editSubtitle}</p>
      </div>
      <OwnerItemEditForm item={item} />
    </div>
  );
}
