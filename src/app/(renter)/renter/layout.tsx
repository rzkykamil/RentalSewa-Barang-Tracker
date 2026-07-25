import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listRemindersForRenter } from "@/modules/reminders/reminder.service";

export default async function RenterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const reminders = await listRemindersForRenter(user.id).catch(() => []);
  return (
    <DashboardShell user={user} reminders={reminders}>
      {children}
    </DashboardShell>
  );
}
