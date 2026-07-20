import type { Metadata } from "next";
import Link from "next/link";

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
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { itemConditionLabel, itemListCopy } from "@/lib/copy/items";
import { MOCK_ITEMS } from "@/lib/mock/items";
import { MOCK_USERS } from "@/lib/mock/session";
import { formatRupiah } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Barang Saya — Rental Sewa Barang Tracker",
};

export default function OwnerItemsPage() {
  const ownerItems = MOCK_ITEMS.filter((item) => item.ownerId === MOCK_USERS.OWNER.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{itemListCopy.title}</h1>
          <p className="text-sm text-muted-foreground">{itemListCopy.subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/owner/items/new">{itemListCopy.addNew}</Link>
        </Button>
      </div>

      {ownerItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="font-medium text-foreground">{itemListCopy.empty.title}</p>
            <p className="text-sm text-muted-foreground">{itemListCopy.empty.description}</p>
            <Button asChild className="mt-2">
              <Link href="/owner/items/new">{itemListCopy.addNew}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{itemListCopy.table.name}</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    {itemListCopy.table.category}
                  </TableHead>
                  <TableHead>{itemListCopy.table.price}</TableHead>
                  <TableHead>{itemListCopy.table.status}</TableHead>
                  <TableHead className="text-right">{itemListCopy.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ownerItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-56 truncate font-medium text-foreground">
                      <Link href={`/owner/items/${item.id}`} className="hover:underline">
                        {item.name}
                      </Link>
                      <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                        {item.category} &middot; {itemConditionLabel[item.condition]}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {item.category}
                    </TableCell>
                    <TableCell>{formatRupiah(item.pricePerDay)}</TableCell>
                    <TableCell>
                      <ItemStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/owner/items/${item.id}/edit`}>{itemListCopy.edit}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
