-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('H1_REMINDER', 'OVERDUE_ALERT');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('EMAIL', 'IN_APP');

-- CreateTable
CREATE TABLE "reminder_logs" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "type" "ReminderType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminder_logs_booking_id_idx" ON "reminder_logs"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "reminder_logs_booking_id_type_key" ON "reminder_logs"("booking_id", "type");

-- AddForeignKey
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
