"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ItemForm } from "@/components/items/ItemForm";
import { itemFormCopy } from "@/lib/copy/items";
import type { ItemDto } from "@/modules/items/items.service";

interface OwnerItemEditFormProps {
  item: ItemDto;
}

interface ItemApiErrorResponse {
  error: { code: string; message: string };
}

/**
 * Client wrapper around the shared `ItemForm` for the owner edit page —
 * owns the "nonaktifkan barang" action, which calls the real
 * `DELETE /api/v1/items/:id` endpoint (soft-delete → `status = NONAKTIF`,
 * see `deactivateItem` in `src/modules/items/items.service.ts`).
 */
export function OwnerItemEditForm({ item }: OwnerItemEditFormProps) {
  const router = useRouter();
  const [isDeactivated, setIsDeactivated] = React.useState(item.status === "NONAKTIF");
  const [deactivateMessage, setDeactivateMessage] = React.useState<string | null>(null);
  const [deactivateError, setDeactivateError] = React.useState<string | null>(null);

  async function handleDeactivate() {
    setDeactivateMessage(null);
    setDeactivateError(null);

    try {
      const response = await fetch(`/api/v1/items/${item.id}`, { method: "DELETE" });

      if (!response.ok) {
        const body = (await response.json()) as ItemApiErrorResponse;
        setDeactivateError(body.error.message);
        return;
      }

      setIsDeactivated(true);
      setDeactivateMessage(itemFormCopy.deactivate.success);
      router.refresh();
    } catch {
      setDeactivateError("Gagal terhubung ke server. Coba lagi.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {deactivateMessage && (
        <p role="status" className="text-sm font-medium text-status-positive">
          {deactivateMessage}
        </p>
      )}
      {deactivateError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {deactivateError}
        </p>
      )}
      <ItemForm
        mode="edit"
        itemId={item.id}
        initialValues={{
          name: item.name,
          description: item.description ?? "",
          category: item.category,
          condition: item.condition,
          pricePerDay: String(item.pricePerDay),
        }}
        initialPhotos={item.photos}
        onDeactivate={handleDeactivate}
        isDeactivated={isDeactivated}
      />
    </div>
  );
}
