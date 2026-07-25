import type { Metadata } from "next";

import { EmptyState } from "@/components/shared/EmptyState";
import { OwnerBookingsList } from "@/components/bookings/OwnerBookingsList";
import type { OwnerBooking } from "@/components/bookings/OwnerBookingCard";
import { ownerBookingsCopy } from "@/lib/copy/bookings";
import { bookingHasPayment, type PaymentDto } from "@/lib/copy/payments";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserProfile } from "@/modules/auth/auth.service";
import { getItemById } from "@/modules/items/items.service";
import { listBookingsForUser, type BookingDto } from "@/modules/bookings/bookings.service";
import { getPaymentForBooking } from "@/modules/payments/payments.service";

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

/**
 * Resolves the payment record for each booking whose status makes payment
 * tracking relevant (`bookingHasPayment`, docs/todo/integrasi.md Modul
 * Payment Tracking). Fetched directly via the service layer (same pattern
 * as `enrichBookingsForOwner` above) — `markedPaidAt` is serialized to an
 * ISO string since this crosses the server/client boundary into
 * `OwnerBookingsList`.
 */
async function enrichPaymentsForOwner(
  bookings: BookingDto[],
  ownerId: string
): Promise<Record<string, PaymentDto | null>> {
  const relevantBookings = bookings.filter((booking) => bookingHasPayment(booking.status));

  const entries = await Promise.all(
    relevantBookings.map(async (booking) => {
      try {
        const payment = await getPaymentForBooking(booking.id, ownerId, "OWNER");
        const dto: PaymentDto | null = payment
          ? { ...payment, markedPaidAt: payment.markedPaidAt?.toISOString() ?? null }
          : null;
        return [booking.id, dto] as const;
      } catch {
        return [booking.id, null] as const;
      }
    })
  );

  return Object.fromEntries(entries);
}

export default async function OwnerBookingsPage() {
  const user = await getCurrentUser();

  let bookings: OwnerBooking[] = [];
  let payments: Record<string, PaymentDto | null> = {};
  let loadError = false;
  try {
    const result = await listBookingsForUser(user.id, "OWNER", { page: 1, limit: 100 });
    bookings = await enrichBookingsForOwner(result.bookings);
    payments = await enrichPaymentsForOwner(result.bookings, user.id);
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
        <OwnerBookingsList initialBookings={bookings} initialPayments={payments} />
      )}
    </div>
  );
}
