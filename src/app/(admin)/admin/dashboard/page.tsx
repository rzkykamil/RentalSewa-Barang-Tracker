import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listUsers, listItemsForAdmin, listBookingsForAdmin } from "@/modules/admin/admin.service";

export const metadata: Metadata = {
  title: "Dashboard Admin — Rental Sewa Barang Tracker",
};

const FALLBACK_VALUE = "—";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  let summaryCards = [
    { label: "Total User", value: FALLBACK_VALUE },
    { label: "Total Barang", value: FALLBACK_VALUE },
    { label: "Total Booking", value: FALLBACK_VALUE },
    { label: "User Nonaktif", value: FALLBACK_VALUE },
  ];

  try {
    const [allUsers, inactiveUsers, items, bookings] = await Promise.all([
      listUsers({ page: 1, limit: 1 }),
      listUsers({ isActive: false, page: 1, limit: 1 }),
      listItemsForAdmin({ page: 1, limit: 1 }),
      listBookingsForAdmin({ page: 1, limit: 1 }),
    ]);

    summaryCards = [
      { label: "Total User", value: String(allUsers.pagination.total) },
      { label: "Total Barang", value: String(items.pagination.total) },
      { label: "Total Booking", value: String(bookings.pagination.total) },
      { label: "User Nonaktif", value: String(inactiveUsers.pagination.total) },
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
          Pantauan seluruh user, barang, dan booking di platform.
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
