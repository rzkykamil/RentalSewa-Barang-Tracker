import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ALL_USERS } from "@/lib/mock/admin";
import { MOCK_BOOKINGS } from "@/lib/mock/bookings";
import { MOCK_ITEMS } from "@/lib/mock/items";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Dashboard Admin — Rental Sewa Barang Tracker",
};

export default function AdminDashboardPage() {
  const user = MOCK_USERS.ADMIN;

  const summaryCards = [
    { label: "Total User", value: String(ALL_USERS.length) },
    { label: "Total Barang", value: String(MOCK_ITEMS.length) },
    { label: "Total Booking", value: String(MOCK_BOOKINGS.length) },
    {
      label: "User Nonaktif",
      value: String(ALL_USERS.filter((candidate) => !candidate.isActive).length),
    },
  ];

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
