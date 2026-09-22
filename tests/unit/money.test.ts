import { describe, expect, it } from "vitest";
import {
  calculateCommission,
  computeOrderTotals,
  formatCurrency,
  fromMinorUnits,
  isBelowFreeDeliveryThreshold,
  resolveDeliveryFee,
  toMinorUnits,
} from "@/lib/money";

describe("minor unit conversion", () => {
  it("converts cedis to pesewas", () => {
    expect(toMinorUnits(45)).toBe(4500);
    expect(toMinorUnits(19.99)).toBe(1999);
  });

  it("round-trips without drift", () => {
    expect(fromMinorUnits(toMinorUnits(19.99))).toBe(19.99);
    expect(fromMinorUnits(toMinorUnits(0.1) + toMinorUnits(0.2))).toBe(0.3);
  });
});

describe("computeOrderTotals", () => {
  it("sums line items correctly", () => {
    const totals = computeOrderTotals([
      { unitPrice: 45, quantity: 2 },
      { unitPrice: 35, quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(125);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.discount).toBe(0);
    expect(totals.total).toBe(125);
  });

  it("avoids floating point drift on repeating decimals", () => {
    // 0.1 + 0.2 famously != 0.3 in raw floating point.
    const totals = computeOrderTotals([{ unitPrice: 0.1, quantity: 1 }], { deliveryFee: 0.2 });
    expect(totals.total).toBe(0.3);
  });

  it("applies delivery fee and discount", () => {
    const totals = computeOrderTotals([{ unitPrice: 100, quantity: 1 }], {
      deliveryFee: 15,
      discount: 20,
    });
    expect(totals.subtotal).toBe(100);
    expect(totals.deliveryFee).toBe(15);
    expect(totals.discount).toBe(20);
    expect(totals.total).toBe(95);
  });

  it("never lets a discount push the total negative", () => {
    const totals = computeOrderTotals([{ unitPrice: 10, quantity: 1 }], { discount: 1000 });
    expect(totals.total).toBe(0);
  });

  it("treats an empty cart as zero, not an error", () => {
    const totals = computeOrderTotals([]);
    expect(totals).toEqual({ subtotal: 0, deliveryFee: 0, discount: 0, total: 0 });
  });
});

describe("resolveDeliveryFee", () => {
  const settings = { deliveryFee: 15, freeDeliveryThreshold: 200 };

  it("is free for pickup regardless of subtotal", () => {
    expect(resolveDeliveryFee(500, "pickup", settings)).toBe(0);
  });

  it("charges the delivery fee below the free threshold", () => {
    expect(resolveDeliveryFee(100, "delivery", settings)).toBe(15);
  });

  it("waives the fee at or above the free threshold", () => {
    expect(resolveDeliveryFee(200, "delivery", settings)).toBe(0);
    expect(resolveDeliveryFee(250, "delivery", settings)).toBe(0);
  });

  it("always charges when there is no free threshold configured", () => {
    expect(resolveDeliveryFee(10_000, "delivery", { deliveryFee: 15, freeDeliveryThreshold: null })).toBe(15);
  });
});

describe("isBelowFreeDeliveryThreshold", () => {
  it("returns true when there is no threshold at all", () => {
    expect(isBelowFreeDeliveryThreshold(1_000_000, null)).toBe(true);
  });
});

describe("calculateCommission", () => {
  it("computes a straightforward percentage", () => {
    expect(calculateCommission(100, 5)).toBe(5);
  });

  it("avoids floating point drift on awkward totals", () => {
    expect(calculateCommission(19.99, 5)).toBe(1);
  });

  it("returns zero for a zero-value order", () => {
    expect(calculateCommission(0, 5)).toBe(0);
  });
});

describe("formatCurrency", () => {
  it("formats GHS amounts", () => {
    // Exact symbol/spacing can vary by ICU data, so assert on the digits.
    expect(formatCurrency(45, "GHS")).toContain("45.00");
  });
});
