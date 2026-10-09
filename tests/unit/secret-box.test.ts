import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret, isEncrypted } from "@/lib/secret-box";

describe("secret-box", () => {
  beforeAll(() => {
    process.env.PAYMENT_CREDENTIALS_KEY = randomBytes(32).toString("base64");
  });

  it("round-trips a secret and never stores it in the clear", () => {
    const stored = encryptSecret("sk_test_example");
    expect(isEncrypted(stored)).toBe(true);
    expect(stored).not.toContain("sk_test_example");
    expect(decryptSecret(stored)).toBe("sk_test_example");
  });

  it("uses a fresh IV each time", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("passes through keys saved before encryption existed", () => {
    expect(decryptSecret("sk_live_legacy")).toBe("sk_live_legacy");
  });

  it("rejects tampered ciphertext", () => {
    const stored = encryptSecret("sk_test_example");
    const tampered = stored.slice(0, -4) + (stored.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(() => decryptSecret(tampered)).toThrow();
  });
});

describe("secret-box without a key", () => {
  it("stores secrets as before until PAYMENT_CREDENTIALS_KEY is set", () => {
    const saved = process.env.PAYMENT_CREDENTIALS_KEY;
    delete process.env.PAYMENT_CREDENTIALS_KEY;
    try {
      expect(encryptSecret("sk_test_example")).toBe("sk_test_example");
    } finally {
      process.env.PAYMENT_CREDENTIALS_KEY = saved;
    }
  });
});
