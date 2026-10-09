import { describe, expect, it } from "vitest";
import { contrastRatio, readableTextOn } from "@/lib/color";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
    expect(contrastRatio("#5b39a8", "#ffffff")).toBeCloseTo(8.09, 1);
  });
  it("returns null for invalid colours", () => {
    expect(contrastRatio("red", "#ffffff")).toBeNull();
  });
});

describe("readableTextOn", () => {
  it("uses white on dark accents and ink on light ones", () => {
    expect(readableTextOn("#0f766e")).toBe("#ffffff");
    expect(readableTextOn("#facc15")).toBe("#18181b");
  });
});
