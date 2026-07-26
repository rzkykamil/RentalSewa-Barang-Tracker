import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { paymentStatusLabel, type PaymentStatus } from "@/lib/copy/payments";

/**
 * Verifies PaymentStatusBadge's status -> color class mapping against
 * docs/design-system.md §2 (Warna status):
 *   - LUNAS -> hijau (positif) -> `bg-status-positive`
 *   - BELUM_LUNAS -> merah -> `bg-status-late`
 * Also checks the Indonesian text label is always rendered (design-system
 * §5: badge must show a text label, not rely on color alone).
 */

const EXPECTED_COLOR_CLASS: Record<PaymentStatus, string> = {
  LUNAS: "bg-status-positive",
  BELUM_LUNAS: "bg-status-late",
};

describe("PaymentStatusBadge", () => {
  it.each(Object.keys(EXPECTED_COLOR_CLASS) as PaymentStatus[])(
    "menampilkan warna dan label yang benar untuk status %s",
    (status) => {
      render(<PaymentStatusBadge status={status} />);

      const badge = screen.getByText(paymentStatusLabel[status]);
      expect(badge).toHaveClass(EXPECTED_COLOR_CLASS[status]);
    }
  );

  it("menampilkan label teks (bukan hanya warna) untuk setiap status", () => {
    (Object.keys(paymentStatusLabel) as PaymentStatus[]).forEach((status) => {
      const { unmount } = render(<PaymentStatusBadge status={status} />);
      expect(screen.getByText(paymentStatusLabel[status])).toBeInTheDocument();
      unmount();
    });
  });
});
