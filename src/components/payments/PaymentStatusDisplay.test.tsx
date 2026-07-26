import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PaymentStatusDisplay } from "@/components/payments/PaymentStatusDisplay";
import { DEFAULT_PAYMENT_STATUS, paymentStatusLabel, renterPaymentCopy, type PaymentDto } from "@/lib/copy/payments";

/**
 * Covers the Renter-side read-only payment view. Confirms it renders
 * `PaymentStatusBadge` with the same status label as the underlying
 * `payment` prop (part of the "konsistensi status pembayaran antara
 * tampilan Owner & Renter" coverage — see also OwnerPaymentForm.test.tsx).
 */

function buildPayment(overrides: Partial<PaymentDto> = {}): PaymentDto {
  return {
    id: "payment-1",
    bookingId: "booking-1",
    amount: 100000,
    status: "BELUM_LUNAS",
    methodNote: null,
    markedPaidAt: null,
    markedByUserId: "owner-1",
    ...overrides,
  };
}

describe("PaymentStatusDisplay", () => {
  it("menampilkan badge status LUNAS sesuai payment prop", () => {
    render(<PaymentStatusDisplay payment={buildPayment({ status: "LUNAS" })} />);
    expect(screen.getByText(paymentStatusLabel.LUNAS)).toBeInTheDocument();
  });

  it("menampilkan badge status BELUM_LUNAS sesuai payment prop", () => {
    render(<PaymentStatusDisplay payment={buildPayment({ status: "BELUM_LUNAS" })} />);
    expect(screen.getByText(paymentStatusLabel.BELUM_LUNAS)).toBeInTheDocument();
  });

  it("fallback ke status default BELUM_LUNAS saat payment null", () => {
    render(<PaymentStatusDisplay payment={null} />);
    expect(screen.getByText(paymentStatusLabel[DEFAULT_PAYMENT_STATUS])).toBeInTheDocument();
  });

  it("menampilkan catatan metode saat ada, atau pesan default saat kosong", () => {
    const { rerender } = render(
      <PaymentStatusDisplay payment={buildPayment({ methodNote: "Transfer BCA" })} />
    );
    expect(screen.getByText(/Transfer BCA/)).toBeInTheDocument();

    rerender(<PaymentStatusDisplay payment={buildPayment({ methodNote: null })} />);
    expect(screen.getByText(renterPaymentCopy.noteEmpty)).toBeInTheDocument();
  });
});
