import { describe, expect, it } from "vitest";
import { isLowStock, isOutOfStock } from "@/lib/inventory";

describe("isOutOfStock", () => {
  it("is true only when tracked and at zero", () => {
    expect(isOutOfStock({ track_inventory: true, stock_quantity: 0, low_stock_threshold: null })).toBe(true);
  });

  it("is false when inventory isn't tracked, even at zero", () => {
    expect(isOutOfStock({ track_inventory: false, stock_quantity: 0, low_stock_threshold: null })).toBe(false);
  });

  it("is false with stock remaining", () => {
    expect(isOutOfStock({ track_inventory: true, stock_quantity: 1, low_stock_threshold: null })).toBe(false);
  });
});

describe("isLowStock", () => {
  it("uses the product's own threshold when set", () => {
    expect(isLowStock({ track_inventory: true, stock_quantity: 3, low_stock_threshold: 5 }, 10)).toBe(true);
    expect(isLowStock({ track_inventory: true, stock_quantity: 8, low_stock_threshold: 5 }, 10)).toBe(false);
  });

  it("falls back to the store default threshold", () => {
    expect(isLowStock({ track_inventory: true, stock_quantity: 4, low_stock_threshold: null }, 5)).toBe(true);
    expect(isLowStock({ track_inventory: true, stock_quantity: 6, low_stock_threshold: null }, 5)).toBe(false);
  });

  it("is never low stock once it hits zero -- that's out of stock instead", () => {
    expect(isLowStock({ track_inventory: true, stock_quantity: 0, low_stock_threshold: 5 }, 5)).toBe(false);
  });

  it("is never low stock when inventory isn't tracked", () => {
    expect(isLowStock({ track_inventory: false, stock_quantity: 0, low_stock_threshold: 5 }, 5)).toBe(false);
  });
});
