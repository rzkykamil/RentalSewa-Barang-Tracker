import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listBookingsForUser } from "@/modules/bookings/bookings.service";
import { countPendingReviewsForRenter } from "@/modules/reviews/reviews.service";

export const metadata: Metadata = {
  title: "Dashboard Renter — Rental Sewa Barang Tracker",
};

const FALLBACK_VALUE = "—";

export default async function RenterDashboardPage() {
  const user = await getCurrentUser();

  let summaryCards = [
    { label: "Booking Aktif", value: FALLBACK_VALUE },
    { label: "Menunggu Persetujuan", value: FALLBACK_VALUE },
    { label: "Riwayat Sewa", value: FALLBACK_VALUE },
    { label: "Perlu Direview", value: FALLBACK_VALUE },
  ];

  try {
    const [activeBookings, pendingBookings, completedBookings, pendingReviews] = await Promise.all([
      listBookingsForUser(user.id, "RENTER", { status: "ACTIVE", page: 1, limit: 1 }),
      listBookingsForUser(user.id, "RENTER", { status: "PENDING", page: 1, limit: 1 }),
      listBookingsForUser(user.id, "RENTER", { status: "COMPLETED", page: 1, limit: 1 }),
      countPendingReviewsForRenter(user.id),
    ]);

    summaryCards = [
      { label: "Booking Aktif", value: String(activeBookings.pagination.total) },
      { label: "Menunggu Persetujuan", value: String(pendingBookings.pagination.total) },
      { label: "Riwayat Sewa", value: String(completedBookings.pagination.total) },
      { label: "Perlu Direview", value: String(pendingReviews) },
    ];
  } catch {
    // Keep fallback dashes — summary cards are non-critical, page should still render.
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Selamat datang, {user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan booking dan sewa barang Anda.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
