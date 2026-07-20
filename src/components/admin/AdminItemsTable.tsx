"use client";

import * as React from "react";

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
import type { MockItem } from "@/lib/mock/items";
import { formatRupiah } from "@/lib/utils";

interface AdminItemsTableProps {
  initialItems: MockItem[];
}

/**
 * Admin "Kelola Barang" list. Periode 16 (frontend + mock data only):
 * "force deactivate" only mutates local React state — no real persistence
 * yet, see docs/todo/frontend.md.
 */
export function AdminItemsTable({ initialItems }: AdminItemsTableProps) {
  const [items, setItems] = React.useState(initialItems);
  const [message, setMessage] = React.useState<string | null>(null);

  function handleForceDeactivate(item: MockItem) {
    setItems((prev) =>
      prev.map((candidate) =>
        candidate.id === item.id ? { ...candidate, status: "NONAKTIF" } : candidate
      )
    );
    setMessage(adminItemsCopy.success);
  }

  if (items.length === 0) {
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
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="max-w-56 truncate font-medium text-foreground">
                    {item.name}
                    <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                      {item.ownerName} &middot; {item.category}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {item.ownerName}
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
                          <Button variant="destructive" size="sm">
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
