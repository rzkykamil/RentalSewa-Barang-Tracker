import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listRemindersForOwner } from "@/modules/reminders/reminder.service";

export default async function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const reminders = await listRemindersForOwner(user.id).catch(() => []);
  return (
    <DashboardShell user={user} reminders={reminders}>
      {children}
    </DashboardShell>
  );
}
