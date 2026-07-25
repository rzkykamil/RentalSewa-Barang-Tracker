import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listItemsByOwner } from "@/modules/items/items.service";
import { listBookingsForUser } from "@/modules/bookings/bookings.service";
import { countUnpaidPaymentsForOwner } from "@/modules/payments/payments.service";

export const metadata: Metadata = {
  title: "Dashboard Owner — Rental Sewa Barang Tracker",
};

const FALLBACK_VALUE = "—";

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser();

  let summaryCards = [
    { label: "Barang Aktif", value: FALLBACK_VALUE },
    { label: "Request Masuk", value: FALLBACK_VALUE },
    { label: "Booking Berjalan", value: FALLBACK_VALUE },
    { label: "Belum Lunas", value: FALLBACK_VALUE },
  ];

  try {
    const [items, pendingRequests, activeBookings, unpaidCount] = await Promise.all([
      listItemsByOwner(user.id),
      listBookingsForUser(user.id, "OWNER", { status: "PENDING", page: 1, limit: 1 }),
      listBookingsForUser(user.id, "OWNER", { status: "ACTIVE", page: 1, limit: 1 }),
      countUnpaidPaymentsForOwner(user.id),
    ]);

    summaryCards = [
      { label: "Barang Aktif", value: String(items.filter((item) => item.status !== "NONAKTIF").length) },
      { label: "Request Masuk", value: String(pendingRequests.pagination.total) },
      { label: "Booking Berjalan", value: String(activeBookings.pagination.total) },
      { label: "Belum Lunas", value: String(unpaidCount) },
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
          Ringkasan barang dan booking yang Anda kelola.
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
