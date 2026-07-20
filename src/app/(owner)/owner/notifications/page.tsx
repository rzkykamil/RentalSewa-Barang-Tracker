import type { Metadata } from "next";

import { ReminderList } from "@/components/reminders/ReminderList";
import { ownerNotificationsPageCopy } from "@/lib/copy/reminders";
import { getRemindersForOwner } from "@/lib/mock/reminders";
import { MOCK_USERS } from "@/lib/mock/session";

export const metadata: Metadata = {
  title: "Notifikasi — Rental Sewa Barang Tracker",
};

export default function OwnerNotificationsPage() {
  const reminders = getRemindersForOwner(MOCK_USERS.OWNER.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{ownerNotificationsPageCopy.title}</h1>
        <p className="text-sm text-muted-foreground">{ownerNotificationsPageCopy.subtitle}</p>
      </div>

      <ReminderList reminders={reminders} role="OWNER" />
    </div>
  );
}
