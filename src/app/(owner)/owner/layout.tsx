import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MOCK_USERS } from "@/lib/mock/session";

export default function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardShell user={MOCK_USERS.OWNER}>{children}</DashboardShell>;
}
