import { beforeEach, describe, expect, it, vi } from "vitest";

let paymentsReady = false;
let publishedProducts = 0;
const storeUpdates: unknown[] = [];

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(async () => {}) }));
vi.mock("@/lib/auth/session", () => ({
  requireStoreAccess: async () => ({ role: "owner", store: { id: "store-1", owner_id: "user-1", slug: "amara" } }),
}));
vi.mock("@/lib/payments", () => ({ isPaymentProviderConfigured: async () => paymentsReady }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        update: (values: unknown) => {
          storeUpdates.push({ table, values });
          return q;
        },
        then: (resolve: (v: unknown) => unknown) =>
          resolve(table === "products" ? { count: publishedProducts, error: null } : { error: null }),
      };
      return q;
    },
  }),
}));

const { publishStoreAction } = await import("@/app/dashboard/[slug]/actions");

describe("publishStoreAction", () => {
  beforeEach(() => {
    storeUpdates.length = 0;
  });

  it("refuses to publish without Paystack connected", async () => {
    paymentsReady = false;
    publishedProducts = 3;
    const result = await publishStoreAction("amara");
    expect(result.error).toMatch(/Paystack/);
    expect(storeUpdates).toHaveLength(0);
  });

  it("refuses to publish with no published products", async () => {
    paymentsReady = true;
    publishedProducts = 0;
    const result = await publishStoreAction("amara");
    expect(result.error).toMatch(/product/);
    expect(storeUpdates).toHaveLength(0);
  });

  it("publishes a ready store", async () => {
    paymentsReady = true;
    publishedProducts = 1;
    expect(await publishStoreAction("amara")).toEqual({});
    expect(storeUpdates).toHaveLength(1);
  });
});
