"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User as UserIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReminderBell } from "@/components/reminders/ReminderBell";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV } from "@/lib/dashboard/nav-config";
import { getRemindersForOwner, getRemindersForRenter } from "@/lib/mock/reminders";
import { ROLE_LABEL, type MockUser } from "@/lib/mock/session";

interface DashboardShellProps {
  user: MockUser;
  children: React.ReactNode;
}

/**
 * Shared dashboard shell used by the Owner, Renter, and Admin route
 * groups. Nav items differ per role (see src/lib/dashboard/nav-config.ts)
 * but the layout structure — topbar + responsive nav + content area — is
 * shared so the three shells stay visually consistent.
 *
 * There is no real session in this phase: `user` is a hardcoded mock user
 * passed in by each role's layout.tsx (see src/lib/mock/session.ts).
 */
export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = DASHBOARD_NAV[user.role];

  function handleLogout() {
    // Mock only — no real session to clear yet.
    router.push("/login");
  }

  const profileHref = navItems.find((item) => item.label === "Profil")?.href ?? "#";

  // Reminders (H-1 / overdue) only apply to Owner and Renter roles — Admin
  // has no bookings of its own to be reminded about, per docs/prd.md.
  const reminders =
    user.role === "OWNER"
      ? getRemindersForOwner(user.id)
      : user.role === "RENTER"
        ? getRemindersForRenter(user.id)
        : [];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-muted/40">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background px-4 sm:px-6">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          Rental Sewa Barang Tracker
        </span>
        <Badge variant="outline" className="ml-1">
          {ROLE_LABEL[user.role]}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          {(user.role === "OWNER" || user.role === "RENTER") && (
            <ReminderBell reminders={reminders} role={user.role} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <UserIcon className="size-4" aria-hidden="true" />
              </span>
              <span className="hidden sm:inline">{user.name}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <UserIcon aria-hidden="true" />
                  Edit Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={handleLogout}>
                <LogOut aria-hidden="true" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <nav
          aria-label="Navigasi dashboard"
          className="flex gap-1 overflow-x-auto border-b border-border bg-background px-2 py-2 lg:w-56 lg:flex-col lg:border-b-0 lg:border-r lg:px-3 lg:py-4"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.comingSoon) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  title="Segera hadir"
                  className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-muted-foreground/60"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {item.label}
                  <span className="text-[10px] text-muted-foreground/60">(segera)</span>
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
