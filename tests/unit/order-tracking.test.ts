import { describe, expect, it, vi } from "vitest";

// Records every filter the lookup applies, so the test can prove the email
// is matched exactly (eq) and never with a pattern (like/ilike).
const calls: { method: string; args: unknown[] }[] = [];
const chain: Record<string, unknown> = new Proxy(
  {},
  {
    get(_t, method: string) {
      if (method === "then") return undefined;
      if (method === "maybeSingle") return async () => ({ data: null, error: null });
      return (...args: unknown[]) => {
        calls.push({ method, args });
        return chain;
      };
    },
  },
);

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: () => chain }) }));

const { getOrderForTracking } = await import("@/lib/orders");

describe("getOrderForTracking", () => {
  it("matches the email exactly, never as a pattern", async () => {
    await getOrderForTracking("store-1", " AB-1001 ", "  Ama@Example.com ");

    expect(calls).toContainEqual({ method: "eq", args: ["store_id", "store-1"] });
    expect(calls).toContainEqual({ method: "eq", args: ["order_number", "AB-1001"] });
    expect(calls).toContainEqual({ method: "eq", args: ["customers.email", "ama@example.com"] });
    expect(calls.some((c) => c.method === "ilike" || c.method === "like")).toBe(false);
  });

  it("passes wildcard characters through literally", async () => {
    calls.length = 0;
    await getOrderForTracking("store-1", "AB-1001", "____@gmail.com");
    expect(calls).toContainEqual({ method: "eq", args: ["customers.email", "____@gmail.com"] });
  });
});
