import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_USERS } from "@/lib/mock/session";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell user={MOCK_USERS.ADMIN}>{children}</DashboardShell>;
}
