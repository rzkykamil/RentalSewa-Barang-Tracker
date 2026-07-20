import type { Metadata } from "next";

import { ProfileForm } from "@/components/profile/ProfileForm";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Edit Profil — Rental Sewa Barang Tracker",
};

export default function AdminProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Edit Profil</h1>
        <p className="text-sm text-muted-foreground">
          Perbarui data akun admin Anda.
        </p>
      </div>
      <ProfileForm user={MOCK_USERS.ADMIN} />
    </div>
  );
}
