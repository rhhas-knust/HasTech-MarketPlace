import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeDb, type FakeDb } from "./helpers/fake-db";
import type { VerifyTransactionResult } from "@/lib/payments/types";

let db: FakeDb;
let paystack: (reference: string) => VerifyTransactionResult;
const sendOrderPaidEmails = vi.fn(async () => {});
const recordCommissionForOrder = vi.fn(async () => {});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => db }));
vi.mock("@/lib/payments", () => ({
  getPaymentProviderForStore: async () => ({
    name: "paystack",
    verifyTransaction: async (reference: string) => paystack(reference),
  }),
}));
vi.mock("@/lib/payments/platform", () => ({ recordCommissionForOrder }));
vi.mock("@/lib/order-emails", () => ({ sendOrderPaidEmails }));

const { verifyAndProcessPayment } = await import("@/lib/payments/process");
const { getDigitalDownloadsForOrder } = await import("@/lib/digital-downloads");

const STORE = "store-1";
const REF = "AB-1001-x1";

function paystackSays(status: VerifyTransactionResult["status"], overrides: Partial<VerifyTransactionResult> = {}) {
  paystack = (reference) => ({
    status,
    reference,
    amountMinorUnits: 9000,
    currency: "GHS",
    channel: "mobile_money",
    paidAt: null,
    raw: { status },
    ...overrides,
  });
}

const order = () => db.tables.orders[0];
const payment = () => db.tables.payments[0];

beforeEach(() => {
  vi.clearAllMocks();
  db = createFakeDb();
  db.unique.payment_events = [["provider", "reference", "event_type"]];
  db.tables.orders = [
    { id: "order-1", store_id: STORE, order_number: "AB-1001", payment_status: "pending", fulfilment_status: "pending" },
  ];
  db.tables.payments = [
    { id: "pay-1", store_id: STORE, order_id: "order-1", reference: REF, amount: 90, currency: "GHS", status: "pending" },
  ];
  db.tables.order_items = [
    { id: "item-1", order_id: "order-1", product_name: "E-book", digital_file_path: "store-1/p1/file.pdf", digital_file_name: "book.pdf" },
  ];
});

describe("verifyAndProcessPayment", () => {
  it("marks the order paid only after Paystack confirms the right amount and currency", async () => {
    paystackSays("success");
    const result = await verifyAndProcessPayment(STORE, REF);

    expect(result.status).toBe("paid");
    expect(order().payment_status).toBe("paid");
    expect(order().fulfilment_status).toBe("confirmed");
    expect(payment().status).toBe("success");
    expect(sendOrderPaidEmails).toHaveBeenCalledTimes(1);
    expect(recordCommissionForOrder).toHaveBeenCalledTimes(1);
  });

  it("processes a repeated verification only once", async () => {
    paystackSays("success");
    await verifyAndProcessPayment(STORE, REF);
    const second = await verifyAndProcessPayment(STORE, REF);

    expect(second.status).toBe("already_paid");
    expect(sendOrderPaidEmails).toHaveBeenCalledTimes(1);
    expect(db.tables.analytics_events.filter((e) => e.event_type === "purchase")).toHaveLength(1);
  });

  it("lets exactly one of two racing callers (webhook + success page) process the payment", async () => {
    paystackSays("success");
    const results = await Promise.all([verifyAndProcessPayment(STORE, REF), verifyAndProcessPayment(STORE, REF)]);

    expect(results.map((r) => r.status).sort()).toEqual(["already_paid", "paid"]);
    expect(sendOrderPaidEmails).toHaveBeenCalledTimes(1);
  });

  it("rejects an amount that doesn't match the order", async () => {
    paystackSays("success", { amountMinorUnits: 100 });
    const result = await verifyAndProcessPayment(STORE, REF);

    expect(result.status).toBe("failed");
    expect(order().payment_status).toBe("pending");
    expect(sendOrderPaidEmails).not.toHaveBeenCalled();
  });

  it("rejects a currency that doesn't match the order", async () => {
    paystackSays("success", { currency: "USD" });
    expect((await verifyAndProcessPayment(STORE, REF)).status).toBe("failed");
    expect(order().payment_status).toBe("pending");
  });

  it("refuses a Paystack response for a different reference", async () => {
    paystack = () => ({ status: "success", reference: "SOMEONE-ELSE", amountMinorUnits: 9000, currency: "GHS", channel: null, paidAt: null, raw: {} });
    await expect(verifyAndProcessPayment(STORE, REF)).rejects.toThrow();
    expect(order().payment_status).toBe("pending");
  });

  it("never reports an abandoned payment as paid, however often the page is reloaded", async () => {
    paystackSays("abandoned");
    const first = await verifyAndProcessPayment(STORE, REF);
    const reload = await verifyAndProcessPayment(STORE, REF);

    expect(first.status).toBe("failed");
    expect(reload.status).toBe("failed");
    expect(order().payment_status).toBe("pending");
    expect(await getDigitalDownloadsForOrder("order-1")).toEqual([]);
    expect(db.signedUrls).toHaveLength(0);
  });

  it("keeps a pending Mobile Money payment open and completes it when Paystack confirms", async () => {
    paystackSays("pending");
    const waiting = await verifyAndProcessPayment(STORE, REF);
    expect(waiting.status).toBe("pending");
    expect(payment().status).toBe("pending");
    expect(db.tables.payment_events ?? []).toHaveLength(0);

    paystackSays("success");
    expect((await verifyAndProcessPayment(STORE, REF)).status).toBe("paid");
    expect(order().payment_status).toBe("paid");
  });

  it("completes a payment that an earlier check recorded as failed", async () => {
    paystackSays("failed");
    expect((await verifyAndProcessPayment(STORE, REF)).status).toBe("failed");

    paystackSays("success");
    expect((await verifyAndProcessPayment(STORE, REF)).status).toBe("paid");
    expect(payment().status).toBe("success");
  });

  it("does not reopen an order the seller cancelled before the payment landed", async () => {
    order().fulfilment_status = "cancelled";
    paystackSays("success");
    await verifyAndProcessPayment(STORE, REF);

    expect(order().payment_status).toBe("paid");
    expect(order().fulfilment_status).toBe("cancelled");
  });

  it("does not override a seller's manual refund", async () => {
    order().payment_status = "refunded";
    paystackSays("success");
    const result = await verifyAndProcessPayment(STORE, REF);

    expect(result.status).toBe("failed");
    expect(order().payment_status).toBe("refunded");
  });
});

describe("getDigitalDownloadsForOrder", () => {
  it("returns no links for an unpaid order", async () => {
    expect(await getDigitalDownloadsForOrder("order-1")).toEqual([]);
    expect(db.signedUrls).toHaveLength(0);
  });

  it("signs links once the order is paid", async () => {
    order().payment_status = "paid";
    const downloads = await getDigitalDownloadsForOrder("order-1");
    expect(downloads).toHaveLength(1);
    expect(downloads[0].fileName).toBe("book.pdf");
  });
});
