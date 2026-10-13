import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { PaystackProvider } from "@/lib/payments/paystack";

describe("PaystackProvider.verifyWebhookSignature", () => {
  const secret = "sk_test_abc123";
  const provider = new PaystackProvider(secret);
  const body = JSON.stringify({ event: "charge.success", data: { reference: "ref-1" } });

  it("accepts a signature computed with the correct secret", () => {
    const validSignature = createHmac("sha512", secret).update(body).digest("hex");
    expect(provider.verifyWebhookSignature(body, validSignature)).toBe(true);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const wrongSignature = createHmac("sha512", "sk_test_someone_else").update(body).digest("hex");
    expect(provider.verifyWebhookSignature(body, wrongSignature)).toBe(false);
  });

  it("rejects a tampered body even with a validly-formed signature", () => {
    const validSignature = createHmac("sha512", secret).update(body).digest("hex");
    const tamperedBody = body.replace("ref-1", "ref-2");
    expect(provider.verifyWebhookSignature(tamperedBody, validSignature)).toBe(false);
  });

  it("rejects a missing signature header", () => {
    expect(provider.verifyWebhookSignature(body, null)).toBe(false);
  });

  it("rejects garbage input without throwing", () => {
    expect(provider.verifyWebhookSignature(body, "not-a-real-signature")).toBe(false);
  });
});

describe("mapStatus", () => {
  it("treats in-flight Paystack statuses as pending, never failed", async () => {
    const { mapStatus } = await import("@/lib/payments/paystack");
    for (const status of ["ongoing", "pending", "processing", "queued", "something_new"]) {
      expect(mapStatus(status)).toBe("pending");
    }
  });

  it("maps final statuses", async () => {
    const { mapStatus } = await import("@/lib/payments/paystack");
    expect(mapStatus("success")).toBe("success");
    expect(mapStatus("abandoned")).toBe("abandoned");
    expect(mapStatus("failed")).toBe("failed");
    expect(mapStatus("reversed")).toBe("failed");
  });
});
