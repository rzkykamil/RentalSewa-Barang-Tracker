import type { Metadata } from "next";

import { ReminderList } from "@/components/reminders/ReminderList";
import { renterNotificationsPageCopy } from "@/lib/copy/reminders";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { listRemindersForRenter } from "@/modules/reminders/reminder.service";

export const metadata: Metadata = {
  title: "Notifikasi — Rental Sewa Barang Tracker",
};

export default async function RenterNotificationsPage() {
  const user = await getCurrentUser();
  const reminders = await listRemindersForRenter(user.id).catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{renterNotificationsPageCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{renterNotificationsPageCopy.subtitle}</p>
      </div>

      <ReminderList reminders={reminders} role="RENTER" />
    </div>
  );
}
