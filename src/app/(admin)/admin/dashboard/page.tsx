import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Dashboard Admin — Rental Sewa Barang Tracker",
};

const summaryCards = [
  { label: "Total User", value: "—" },
  { label: "Total Barang", value: "—" },
  { label: "Total Booking", value: "—" },
  { label: "User Nonaktif", value: "—" },
];

export default function AdminDashboardPage() {
  const user = MOCK_USERS.ADMIN;

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

      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Modul pengawasan Admin belum tersedia — halaman ini akan
          menampilkan data sungguhan setelah modul terkait dikerjakan.
        </CardContent>
      </Card>
    </div>
  );
}
