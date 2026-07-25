"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { adminItemsCopy } from "@/lib/copy/admin";
import type { AdminItemDto } from "@/modules/admin/admin.service";
import { formatRupiah } from "@/lib/utils";

interface AdminItemsTableProps {
  initialItems: AdminItemDto[];
}

interface AdminApiErrorResponse {
  error: { code: string; message: string; details?: unknown };
}

const FALLBACK_ERROR = "Gagal menonaktifkan barang. Coba lagi.";

/**
 * Admin "Kelola Barang" list. Force-deactivate calls the real
 * `PATCH /api/v1/admin/items/:id/deactivate` endpoint and re-fetches the
 * list via `router.refresh()` (same pattern as `OwnerBookingsList`) —
 * no local item-state mutation.
 */
export function AdminItemsTable({ initialItems }: AdminItemsTableProps) {
  const router = useRouter();
  const [message, setMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = React.useState<string | null>(null);

  async function handleForceDeactivate(item: AdminItemDto) {
    setMessage(null);
    setErrorMessage(null);
    setPendingItemId(item.id);

    try {
      const response = await fetch(`/api/v1/admin/items/${item.id}/deactivate`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const body = (await response.json()) as AdminApiErrorResponse;
        setErrorMessage(body.error.message || FALLBACK_ERROR);
        return;
      }

      setMessage(adminItemsCopy.success);
      router.refresh();
    } catch {
      setErrorMessage(FALLBACK_ERROR);
    } finally {
      setPendingItemId(null);
    }
  }

  if (initialItems.length === 0) {
    return (
      <EmptyState title={adminItemsCopy.empty.title} description={adminItemsCopy.empty.description} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p role="status" className="text-sm font-medium text-status-positive">
          {message}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {errorMessage}
        </p>
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{adminItemsCopy.table.name}</TableHead>
                <TableHead className="hidden sm:table-cell">{adminItemsCopy.table.owner}</TableHead>
                <TableHead className="hidden sm:table-cell">{adminItemsCopy.table.category}</TableHead>
                <TableHead>{adminItemsCopy.table.price}</TableHead>
                <TableHead>{adminItemsCopy.table.status}</TableHead>
                <TableHead className="text-right">{adminItemsCopy.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-56 truncate font-medium text-foreground">
                    {item.name}
                    <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                      {item.owner.name} &middot; {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {item.owner.name}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {item.category}
                  </TableCell>
                  <TableCell>{formatRupiah(item.pricePerDay)}</TableCell>
                  <TableCell>
                    <ItemStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {item.status === "NONAKTIF" ? (
                      <span className="text-xs text-muted-foreground">
                        {adminItemsCopy.alreadyInactive}
                      </span>
                    ) : (
                      <ConfirmDialog
                        trigger={
                          <Button variant="destructive" size="sm" disabled={pendingItemId === item.id}>
                            {adminItemsCopy.actions.forceDeactivate}
                          </Button>
                        }
                        title={adminItemsCopy.dialog.title}
                        description={adminItemsCopy.dialog.description}
                        confirmLabel={adminItemsCopy.dialog.confirm}
                        onConfirm={() => handleForceDeactivate(item)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
