import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { RenterBookingCard, type RenterBooking } from "@/components/bookings/RenterBookingCard";
import { renterBookingsCopy } from "@/lib/copy/bookings";
import { getPaymentByBookingId } from "@/lib/mock/payments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserProfile } from "@/modules/auth/auth.service";
import { getItemById } from "@/modules/items/items.service";
import { listBookingsForUser, type BookingDto } from "@/modules/bookings/bookings.service";

export const metadata: Metadata = {
  title: "Booking Saya — Rental Sewa Barang Tracker",
};

/**
 * Resolves `itemName`/`ownerName` for the Renter "Booking Saya" list.
 * `BookingDto` only carries `itemId` — this page (a server component)
 * enriches it with the item name and the item's owner name by calling the
 * item/auth service modules directly, without changing the API response
 * shape (see docs/todo/integrasi.md Modul Booking).
 */
async function enrichBookingsForRenter(bookings: BookingDto[]): Promise<RenterBooking[]> {
  const uniqueItemIds = Array.from(new Set(bookings.map((booking) => booking.itemId)));
  const items = await Promise.all(uniqueItemIds.map((itemId) => getItemById(itemId)));
  const itemById = new Map(items.filter((item) => item !== null).map((item) => [item.id, item]));

  const uniqueOwnerIds = Array.from(
    new Set(items.filter((item) => item !== null).map((item) => item.ownerId))
  );
  const owners = await Promise.all(uniqueOwnerIds.map((ownerId) => getUserProfile(ownerId)));
  const ownerById = new Map(owners.filter((owner) => owner !== null).map((owner) => [owner.id, owner]));

  return bookings.map((booking) => {
    const item = itemById.get(booking.itemId);
    const ownerName = item ? (ownerById.get(item.ownerId)?.name ?? "Pemilik tidak ditemukan") : "Pemilik tidak ditemukan";

    return {
      id: booking.id,
      itemName: item?.name ?? "Barang tidak ditemukan",
      ownerName,
      startDate: booking.startDate.toISOString(),
      endDate: booking.endDate.toISOString(),
      totalPrice: booking.totalPrice,
      status: booking.status,
      notes: booking.notes,
    };
  });
}

export default async function RenterBookingsPage() {
  const user = await getCurrentUser();

  let bookings: RenterBooking[] = [];
  let loadError = false;
  try {
    const result = await listBookingsForUser(user.id, "RENTER", { page: 1, limit: 100 });
    bookings = await enrichBookingsForRenter(result.bookings);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{renterBookingsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{renterBookingsCopy.subtitle}</p>
      </div>

      {loadError ? (
        <EmptyState
          title="Gagal memuat booking"
          description="Terjadi kesalahan saat mengambil daftar booking Anda. Coba muat ulang halaman."
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={renterBookingsCopy.empty.title}
          description={renterBookingsCopy.empty.description}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <RenterBookingCard
              key={booking.id}
              booking={booking}
              payment={getPaymentByBookingId(booking.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
