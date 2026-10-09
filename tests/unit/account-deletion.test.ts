import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake service-role client that records every call in order, so the test
// can check what account erasure touches and in what sequence.
type Call = { target: string; op: string; args: unknown[] };
const calls: Call[] = [];
const selectResults: Record<string, unknown[]> = {};

function builder(table: string) {
  let op = "select";
  const record = (name: string, args: unknown[]) => calls.push({ target: table, op: name, args });
  const chain: Record<string, unknown> = {};
  for (const m of ["select", "insert", "update", "delete"]) {
    chain[m] = (...args: unknown[]) => {
      if (m !== "select" || op === "select") op = m;
      record(m, args);
      return chain;
    };
  }
  for (const m of ["eq", "in", "is", "lte", "gt", "order", "limit"]) {
    chain[m] = (...args: unknown[]) => {
      record(m, args);
      return chain;
    };
  }
  const result = () => ({ data: op === "select" ? (selectResults[table] ?? []) : [], error: null });
  chain.maybeSingle = async () => ({ data: (selectResults[table] ?? [])[0] ?? null, error: null });
  chain.single = async () => ({ data: (selectResults[table] ?? [])[0] ?? null, error: null });
  chain.then = (resolve: (v: unknown) => unknown) => resolve(result());
  return chain;
}

const fakeAdmin = {
  from: (table: string) => builder(table),
  storage: {
    from: (bucket: string) => ({
      remove: async (paths: string[]) => {
        calls.push({ target: `storage:${bucket}`, op: "remove", args: [paths] });
        return { data: [], error: null };
      },
    }),
  },
  auth: {
    admin: {
      deleteUser: async (id: string) => {
        calls.push({ target: "auth", op: "deleteUser", args: [id] });
        return { error: null };
      },
      createUser: async () => {
        calls.push({ target: "auth", op: "createUser", args: [] });
        return { data: { user: { id: "placeholder-id" } }, error: null };
      },
    },
  },
};

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fakeAdmin }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => {}) }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(async () => {}) }));

const { purgeAccount } = await import("@/lib/account-deletion");

const indexOf = (pred: (c: Call) => boolean) => calls.findIndex(pred);

describe("purgeAccount", () => {
  beforeEach(() => {
    calls.length = 0;
    for (const k of Object.keys(selectResults)) delete selectResults[k];
  });

  it("empties an owned store, hands the shell to the placeholder, then deletes the user", async () => {
    selectResults.stores = [{ id: "store-1" }];
    selectResults.products = [{ id: "p1", digital_file_path: "store-1/p1/book.pdf" }];
    selectResults.product_images = [{ storage_path: "store-1/p1/a.jpg" }];
    selectResults.customers = [{ id: "c1-aaaaaaaa" }];

    await purgeAccount("user-1");

    const images = indexOf((c) => c.target === "storage:product-images" && c.op === "remove");
    const files = indexOf((c) => c.target === "storage:product-files" && c.op === "remove");
    const productsDeleted = indexOf((c) => c.target === "products" && c.op === "delete");
    const credentials = indexOf((c) => c.target === "store_payment_credentials" && c.op === "delete");
    const anonymised = calls.find((c) => c.target === "customers" && c.op === "update");
    const reassigned = indexOf(
      (c) => c.target === "stores" && c.op === "update" && (c.args[0] as { owner_id?: string }).owner_id === "placeholder-id",
    );
    const inventory = indexOf((c) => c.target === "inventory_movements" && c.op === "update");
    const deleted = indexOf((c) => c.target === "auth" && c.op === "deleteUser");

    // Files go before the rows that point at them.
    expect(images).toBeGreaterThan(-1);
    expect(files).toBeGreaterThan(-1);
    expect(images).toBeLessThan(productsDeleted);
    expect(credentials).toBeGreaterThan(-1);

    // Customers are anonymised, not left with real contact details.
    expect(anonymised?.args[0]).toMatchObject({ phone: null, first_name: null, last_name: null });
    expect((anonymised?.args[0] as { email: string }).email).toMatch(/@deleted\.invalid$/);

    // Both blocking references are cleared before the user is deleted.
    expect(reassigned).toBeGreaterThan(-1);
    expect(inventory).toBeGreaterThan(-1);
    expect(deleted).toBeGreaterThan(reassigned);
    expect(deleted).toBeGreaterThan(inventory);
  });

  it("deletes a staff-only account without touching any store", async () => {
    selectResults.stores = [];
    await purgeAccount("staff-1");

    expect(calls.some((c) => c.target === "products")).toBe(false);
    expect(calls.some((c) => c.target === "auth" && c.op === "createUser")).toBe(false);
    expect(calls.some((c) => c.target === "auth" && c.op === "deleteUser" && c.args[0] === "staff-1")).toBe(true);
  });
});
