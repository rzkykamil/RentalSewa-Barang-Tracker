import type { Metadata } from "next";

import { ReminderList } from "@/components/reminders/ReminderList";
import { renterNotificationsPageCopy } from "@/lib/copy/reminders";
import { getRemindersForRenter } from "@/lib/mock/reminders";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Notifikasi — Rental Sewa Barang Tracker",
};

export default function RenterNotificationsPage() {
  const reminders = getRemindersForRenter(MOCK_USERS.RENTER.id);

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
