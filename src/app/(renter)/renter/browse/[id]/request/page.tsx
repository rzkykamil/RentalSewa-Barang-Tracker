import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookingRequestForm } from "@/components/bookings/BookingRequestForm";
import { bookingRequestFormCopy } from "@/lib/copy/bookings";
import { itemDetailCopy } from "@/lib/copy/items";
import { MOCK_ITEMS } from "@/lib/mock/items";

export const metadata: Metadata = {
  title: "Ajukan Sewa — Rental Sewa Barang Tracker",
};

interface BookingRequestPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingRequestPage({ params }: BookingRequestPageProps) {
  const { id } = await params;
  const item = MOCK_ITEMS.find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <EmptyState
        title={itemDetailCopy.notFoundTitle}
        description={itemDetailCopy.notFoundDescription}
        action={
          <Button asChild variant="outline">
            <Link href="/renter/browse">{itemDetailCopy.backToBrowse}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{bookingRequestFormCopy.title}</h1>
      </div>
      <BookingRequestForm itemId={item.id} itemName={item.name} pricePerDay={item.pricePerDay} />
    </div>
  );
}
