import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Minimal landing page — Periode 1 only builds the Auth module, so this
 * just routes visitors to login/register. The full public landing
 * (browse & discovery) lands with the Item/Booking modules.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-muted/40 px-4 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Rental Sewa Barang Tracker
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Sewa dan kelola barang antar individu — mulai dengan masuk ke akun
          Anda atau daftar sebagai Pemilik Barang / Penyewa.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href="/login">Masuk</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/register">Daftar</Link>
        </Button>
      </div>
    </div>
  );
}
