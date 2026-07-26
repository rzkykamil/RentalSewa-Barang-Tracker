import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import { OwnerPaymentForm } from "@/components/payments/OwnerPaymentForm";
import { PaymentStatusDisplay } from "@/components/payments/PaymentStatusDisplay";
import { DEFAULT_PAYMENT_STATUS, paymentStatusLabel, type PaymentDto } from "@/lib/copy/payments";

/**
 * Covers the Owner-side payment update form. Confirms it renders
 * `PaymentStatusBadge` with the same status label as the underlying
 * `payment` prop, and — together with PaymentStatusDisplay.test.tsx — that
 * both the Owner form and the Renter read-only view render an identical
 * badge for the same `payment` prop (the "konsistensi status pembayaran
 * antara tampilan Owner & Renter" test case in docs/todo/qa.md).
 *
 * Queries scope to `[data-slot="badge"]` because the form's status <Select>
 * also renders the same Indonesian label as its selected option text, which
 * would otherwise collide with a plain `getByText` query.
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

function getBadgeText(container: HTMLElement): string | null {
  return container.querySelector('[data-slot="badge"]')?.textContent ?? null;
}

describe("OwnerPaymentForm", () => {
  it("menampilkan badge status LUNAS sesuai payment prop", () => {
    const { container } = render(
      <OwnerPaymentForm bookingId="booking-1" payment={buildPayment({ status: "LUNAS" })} onSave={vi.fn()} />
    );
    expect(getBadgeText(container)).toBe(paymentStatusLabel.LUNAS);
  });

  it("menampilkan badge status BELUM_LUNAS sesuai payment prop", () => {
    const { container } = render(
      <OwnerPaymentForm
        bookingId="booking-1"
        payment={buildPayment({ status: "BELUM_LUNAS" })}
        onSave={vi.fn()}
      />
    );
    expect(getBadgeText(container)).toBe(paymentStatusLabel.BELUM_LUNAS);
  });

  it("fallback ke status default BELUM_LUNAS saat payment null", () => {
    const { container } = render(<OwnerPaymentForm bookingId="booking-1" payment={null} onSave={vi.fn()} />);
    expect(getBadgeText(container)).toBe(paymentStatusLabel[DEFAULT_PAYMENT_STATUS]);
  });
});

describe("Konsistensi badge status pembayaran Owner vs Renter", () => {
  it.each(["LUNAS", "BELUM_LUNAS"] as const)(
    "OwnerPaymentForm dan PaymentStatusDisplay menampilkan label status %s yang sama untuk payment yang sama",
    (status) => {
      const payment = buildPayment({ status });

      const owner = render(<OwnerPaymentForm bookingId="booking-1" payment={payment} onSave={vi.fn()} />);
      const ownerBadgeText = getBadgeText(owner.container);
      owner.unmount();

      const renter = render(<PaymentStatusDisplay payment={payment} />);
      const renterBadgeText = getBadgeText(renter.container);
      renter.unmount();

      expect(ownerBadgeText).toBe(paymentStatusLabel[status]);
      expect(renterBadgeText).toBe(paymentStatusLabel[status]);
      expect(ownerBadgeText).toBe(renterBadgeText);
    }
  );
});
