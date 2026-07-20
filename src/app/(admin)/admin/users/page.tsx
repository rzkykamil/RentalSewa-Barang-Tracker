import type { Metadata } from "next";

import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { adminUsersCopy } from "@/lib/copy/admin";
import { ALL_USERS } from "@/lib/mock/admin";

export const metadata: Metadata = {
  title: "Kelola User — Rental Sewa Barang Tracker",
};

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{adminUsersCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{adminUsersCopy.subtitle}</p>
      </div>

      <AdminUsersTable initialUsers={ALL_USERS} />
    </div>
  );
}
