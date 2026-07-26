import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { bookingStatusLabel, type BookingStatusValue } from "@/lib/copy/bookings";

/**
 * Verifies BookingStatusBadge's status -> color class mapping against
 * docs/design-system.md §2 (Warna status):
 *   - APPROVED / COMPLETED -> hijau (positif) -> `bg-status-positive`
 *   - PENDING -> kuning/amber -> `bg-status-pending`
 *   - ACTIVE -> biru -> `bg-status-active`
 *   - LATE -> merah -> `bg-status-late`
 *   - REJECTED -> abu-abu (netral/nonaktif) -> `bg-status-inactive`
 * Also checks the Indonesian text label is always rendered (design-system
 * §5: badge must show a text label, not rely on color alone).
 */

const EXPECTED_COLOR_CLASS: Record<BookingStatusValue, string> = {
  PENDING: "bg-status-pending",
  APPROVED: "bg-status-positive",
  ACTIVE: "bg-status-active",
  COMPLETED: "bg-status-positive",
  REJECTED: "bg-status-inactive",
  LATE: "bg-status-late",
};

describe("BookingStatusBadge", () => {
  it.each(Object.keys(EXPECTED_COLOR_CLASS) as BookingStatusValue[])(
    "menampilkan warna dan label yang benar untuk status %s",
    (status) => {
      render(<BookingStatusBadge status={status} />);

      const badge = screen.getByText(bookingStatusLabel[status]);
      expect(badge).toHaveClass(EXPECTED_COLOR_CLASS[status]);
    }
  );

  it("menampilkan label teks (bukan hanya warna) untuk setiap status", () => {
    (Object.keys(bookingStatusLabel) as BookingStatusValue[]).forEach((status) => {
      const { unmount } = render(<BookingStatusBadge status={status} />);
      expect(screen.getByText(bookingStatusLabel[status])).toBeInTheDocument();
      unmount();
    });
  });
});
