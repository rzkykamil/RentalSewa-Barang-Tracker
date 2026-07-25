import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { OwnerBookingsList } from "@/components/bookings/OwnerBookingsList";
import type { OwnerBooking } from "@/components/bookings/OwnerBookingCard";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserProfile } from "@/modules/auth/auth.service";
import { getItemById } from "@/modules/items/items.service";
import { listBookingsForUser, type BookingDto } from "@/modules/bookings/bookings.service";

export const metadata: Metadata = {
  title: "Request Masuk — Rental Sewa Barang Tracker",
};

/**
 * Resolves `itemName`/`renterName` for the Owner "Request Masuk" list.
 * `BookingDto` only carries `itemId`/`renterId` — this page (a server
 * component) enriches it with the item and renter names by calling the
 * item/auth service modules directly, without changing the API response
 * shape (see docs/todo/integrasi.md Modul Booking).
 */
async function enrichBookingsForOwner(bookings: BookingDto[]): Promise<OwnerBooking[]> {
  const uniqueItemIds = Array.from(new Set(bookings.map((booking) => booking.itemId)));
  const uniqueRenterIds = Array.from(new Set(bookings.map((booking) => booking.renterId)));

  const [items, renters] = await Promise.all([
    Promise.all(uniqueItemIds.map((itemId) => getItemById(itemId))),
    Promise.all(uniqueRenterIds.map((renterId) => getUserProfile(renterId))),
  ]);

  const itemById = new Map(items.filter((item) => item !== null).map((item) => [item.id, item]));
  const renterById = new Map(renters.filter((renter) => renter !== null).map((renter) => [renter.id, renter]));

  return bookings.map((booking) => ({
    id: booking.id,
    itemName: itemById.get(booking.itemId)?.name ?? "Barang tidak ditemukan",
    renterName: renterById.get(booking.renterId)?.name ?? "Penyewa tidak ditemukan",
    startDate: booking.startDate.toISOString(),
    endDate: booking.endDate.toISOString(),
    totalPrice: booking.totalPrice,
    status: booking.status,
    notes: booking.notes,
  }));
}

export default async function OwnerBookingsPage() {
  const user = await getCurrentUser();

  let bookings: OwnerBooking[] = [];
  let loadError = false;
  try {
    const result = await listBookingsForUser(user.id, "OWNER", { page: 1, limit: 100 });
    bookings = await enrichBookingsForOwner(result.bookings);
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{ownerBookingsCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{ownerBookingsCopy.subtitle}</p>
      </div>

      {loadError ? (
        <EmptyState
          title="Gagal memuat request masuk"
          description="Terjadi kesalahan saat mengambil daftar request sewa. Coba muat ulang halaman."
        />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={ownerBookingsCopy.empty.title}
          description={ownerBookingsCopy.empty.description}
        />
      ) : (
        <OwnerBookingsList initialBookings={bookings} />
      )}
    </div>
  );
}
