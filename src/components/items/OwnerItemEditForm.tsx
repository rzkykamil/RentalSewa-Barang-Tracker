"use client";

import * as React from "react";

import { ItemForm } from "@/components/items/ItemForm";
import { itemFormCopy } from "@/lib/copy/items";
import type { MockItem, MockItemPhoto } from "@/lib/mock/items";

interface OwnerItemEditFormProps {
  item: MockItem;
  photos: MockItemPhoto[];
}

/**
 * Client wrapper around the shared ItemForm for the owner edit page —
 * holds the local "nonaktifkan barang" state (client-side only, no real
 * persistence yet, see docs/todo/frontend.md).
 */
export function OwnerItemEditForm({ item, photos }: OwnerItemEditFormProps) {
  const [isDeactivated, setIsDeactivated] = React.useState(item.status === "NONAKTIF");
  const [deactivateMessage, setDeactivateMessage] = React.useState<string | null>(null);

  function handleDeactivate() {
    setIsDeactivated(true);
    setDeactivateMessage(itemFormCopy.deactivate.success);
  }

  return (
    <div className="flex flex-col gap-4">
      {deactivateMessage && (
        <p role="status" className="text-sm font-medium text-status-positive">
          {deactivateMessage}
        </p>
      )}
      <ItemForm
        mode="edit"
        initialValues={{
          name: item.name,
          description: item.description,
          category: item.category,
          condition: item.condition,
          pricePerDay: String(item.pricePerDay),
        }}
        initialPhotos={photos.map((photo) => ({ id: photo.id, url: photo.url }))}
        onDeactivate={handleDeactivate}
        isDeactivated={isDeactivated}
      />
    </div>
  );
}
