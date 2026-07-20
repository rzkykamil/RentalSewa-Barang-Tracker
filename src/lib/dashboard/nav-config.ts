import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ClipboardList,
  History,
  LayoutDashboard,
  PackageSearch,
  ShieldCheck,
  Star,
  User,
  Users,
} from "lucide-react";

import type { MockRole } from "@/lib/mock/session";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /**
   * Item belongs to a module not built yet in this phase (see
   * docs/todo/frontend.md) — rendered as a disabled placeholder instead of
   * a dead link.
   */
  comingSoon?: boolean;
}

/**
 * Nav structure per role, following the permission matrix in
 * docs/prd.md §7. All items are wired to real pages now that every module
 * (Auth–Review, Admin) has a frontend implementation; `comingSoon` remains
 * available on `DashboardNavItem` for any future module still in progress.
 */
export const DASHBOARD_NAV: Record<MockRole, DashboardNavItem[]> = {
  OWNER: [
    { label: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
    { label: "Barang Saya", href: "/owner/items", icon: PackageSearch },
    { label: "Request Masuk", href: "/owner/bookings", icon: ClipboardList },
    { label: "Riwayat Transaksi", href: "/owner/history", icon: History },
    { label: "Notifikasi", href: "/owner/notifications", icon: Bell },
    { label: "Profil", href: "/owner/profile", icon: User },
  ],
  RENTER: [
    { label: "Dashboard", href: "/renter/dashboard", icon: LayoutDashboard },
    { label: "Jelajah Barang", href: "/renter/browse", icon: PackageSearch },
    { label: "Booking Saya", href: "/renter/bookings", icon: ClipboardList },
    { label: "Riwayat & Review", href: "/renter/history", icon: Star },
    { label: "Notifikasi", href: "/renter/notifications", icon: Bell },
    { label: "Profil", href: "/renter/profile", icon: User },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Kelola User", href: "/admin/users", icon: Users },
    { label: "Kelola Barang", href: "/admin/items", icon: PackageSearch },
    { label: "Kelola Booking", href: "/admin/bookings", icon: ShieldCheck },
    { label: "Profil", href: "/admin/profile", icon: User },
  ],
};
