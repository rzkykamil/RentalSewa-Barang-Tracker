import type { Metadata } from "next";

import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { adminUsersCopy } from "@/lib/copy/admin";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listUsers, type AdminUserDto } from "@/modules/admin/admin.service";

export const metadata: Metadata = {
  title: "Kelola User — Rental Sewa Barang Tracker",
};

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  let users: AdminUserDto[] = [];
  let loadError = false;
  try {
    const result = await listUsers({ page: 1, limit: 100 });
    users = result.users;
  } catch {
    loadError = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{adminUsersCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{adminUsersCopy.subtitle}</p>
      </div>

      {loadError ? (
        <EmptyState
          title="Gagal memuat daftar user"
          description="Terjadi kesalahan saat mengambil daftar user. Coba muat ulang halaman."
        />
      ) : (
        <AdminUsersTable initialUsers={users} currentUserId={currentUser.id} />
      )}
    </div>
  );
}
