import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb, type FakeDb } from "./helpers/fake-db";

let db: FakeDb;
let paystackStatus = "success";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => db }));
vi.mock("@/lib/payments/paystack", () => ({
  PaystackProvider: class {
    async verifyTransaction(reference: string) {
      return { status: paystackStatus, reference, amountMinorUnits: 10000, currency: "GHS", channel: null, paidAt: null, raw: {} };
    }
  },
}));
process.env.PAYSTACK_PLATFORM_SECRET_KEY = "sk_test_platform";

const { verifyAndProcessPlatformPayment } = await import("@/lib/payments/platform");

beforeEach(() => {
  db = createFakeDb();
  db.tables.platform_billing_payments = [
    { id: "bp-1", store_id: "store-1", kind: "subscription", reference: "SUB-1", amount: 100, currency: "GHS", status: "pending" },
  ];
  db.tables.platform_billing = [
    { store_id: "store-1", billing_plan: "subscription", commission_rate: 5, subscription_price: 100, subscription_status: "inactive", subscription_current_period_end: null, is_founding_member: false, founding_member_until: null },
  ];
});

describe("verifyAndProcessPlatformPayment", () => {
  it("leaves a pending payment pending instead of failing it", async () => {
    paystackStatus = "pending";
    expect((await verifyAndProcessPlatformPayment("store-1", "SUB-1")).status).toBe("pending");
    expect(db.tables.platform_billing_payments[0].status).toBe("pending");
  });

  it("credits a payment that an earlier check marked failed", async () => {
    paystackStatus = "failed";
    expect((await verifyAndProcessPlatformPayment("store-1", "SUB-1")).status).toBe("failed");

    paystackStatus = "success";
    expect((await verifyAndProcessPlatformPayment("store-1", "SUB-1")).status).toBe("success");
    expect(db.tables.platform_billing[0].subscription_status).toBe("active");
  });

  it("reports a failed payment as failed, not as already processed", async () => {
    db.tables.platform_billing_payments[0].status = "failed";
    paystackStatus = "failed";
    expect((await verifyAndProcessPlatformPayment("store-1", "SUB-1")).status).toBe("failed");
  });

  it("only credits a successful payment once", async () => {
    paystackStatus = "success";
    await verifyAndProcessPlatformPayment("store-1", "SUB-1");
    const firstEnd = db.tables.platform_billing[0].subscription_current_period_end;
    expect((await verifyAndProcessPlatformPayment("store-1", "SUB-1")).status).toBe("already_processed");
    expect(db.tables.platform_billing[0].subscription_current_period_end).toBe(firstEnd);
  });
});
