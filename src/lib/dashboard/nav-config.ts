import type { LucideIcon } from "lucide-react";
import {
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
 * docs/prd.md §7. Only "Dashboard" and "Profil" are wired to real pages
 * in this phase — the rest are placeholders for upcoming modules.
 */
export const DASHBOARD_NAV: Record<MockRole, DashboardNavItem[]> = {
  OWNER: [
    { label: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
    { label: "Barang Saya", href: "/owner/items", icon: PackageSearch, comingSoon: true },
    { label: "Request Masuk", href: "/owner/bookings", icon: ClipboardList, comingSoon: true },
    { label: "Riwayat Transaksi", href: "/owner/history", icon: History, comingSoon: true },
    { label: "Profil", href: "/owner/profile", icon: User },
  ],
  RENTER: [
    { label: "Dashboard", href: "/renter/dashboard", icon: LayoutDashboard },
    { label: "Jelajah Barang", href: "/renter/browse", icon: PackageSearch, comingSoon: true },
    { label: "Booking Saya", href: "/renter/bookings", icon: ClipboardList, comingSoon: true },
    { label: "Riwayat & Review", href: "/renter/history", icon: Star, comingSoon: true },
    { label: "Profil", href: "/renter/profile", icon: User },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Kelola User", href: "/admin/users", icon: Users, comingSoon: true },
    { label: "Kelola Barang", href: "/admin/items", icon: PackageSearch, comingSoon: true },
    { label: "Kelola Booking", href: "/admin/bookings", icon: ShieldCheck, comingSoon: true },
    { label: "Profil", href: "/admin/profile", icon: User },
  ],
};
