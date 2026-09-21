import { describe, expect, it } from "vitest";
import { isReservedSlug, isValidSlugFormat, slugify, validateSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Amara Books")).toBe("amara-books");
  });

  it("strips accents and punctuation", () => {
    expect(slugify("Café Déjà Vu!")).toBe("cafe-deja-vu");
  });

  it("collapses repeated separators and trims hyphens", () => {
    expect(slugify("  Hello   World -- Again  ")).toBe("hello-world-again");
  });
});

describe("isValidSlugFormat", () => {
  it("accepts lowercase letters, numbers and hyphens", () => {
    expect(isValidSlugFormat("amara-books-2")).toBe(true);
  });

  it("rejects uppercase, spaces, and leading/trailing hyphens", () => {
    expect(isValidSlugFormat("Amara-Books")).toBe(false);
    expect(isValidSlugFormat("amara books")).toBe(false);
    expect(isValidSlugFormat("-amara")).toBe(false);
    expect(isValidSlugFormat("amara-")).toBe(false);
  });

  it("enforces min/max length", () => {
    expect(isValidSlugFormat("ab")).toBe(false);
    expect(isValidSlugFormat("a".repeat(64))).toBe(false);
    expect(isValidSlugFormat("a".repeat(63))).toBe(true);
  });
});

describe("reserved slugs", () => {
  it("blocks platform routes from being used as a store slug", () => {
    expect(isReservedSlug("dashboard")).toBe(true);
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("checkout")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isReservedSlug("Dashboard")).toBe(true);
  });

  it("allows ordinary store names", () => {
    expect(isReservedSlug("amara-books")).toBe(false);
  });
});

describe("validateSlug", () => {
  it("reports the specific failure reason", () => {
    expect(validateSlug("Bad Slug")).toEqual({ valid: false, reason: "format" });
    expect(validateSlug("checkout")).toEqual({ valid: false, reason: "reserved" });
    expect(validateSlug("amara-books")).toEqual({ valid: true });
  });
});
