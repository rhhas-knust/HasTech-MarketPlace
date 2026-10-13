// A tiny in-memory stand-in for the service-role Supabase client: enough of
// the query builder for the payment, download and billing code paths. Filters
// are applied when the query runs, so a conditional update (e.g. "only if
// still pending") behaves like Postgres would for two racing callers.

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

export interface FakeDb {
  tables: Record<string, Row[]>;
  /** Unique constraints to enforce on insert: table -> column lists. */
  unique: Record<string, string[][]>;
  from: (table: string) => Query;
  storage: { from: (bucket: string) => { createSignedUrl: (path: string) => Promise<{ data: { signedUrl: string } }> } };
  signedUrls: string[];
}

interface Query extends PromiseLike<{ data: unknown; error: unknown }> {
  select: (cols?: string, opts?: unknown) => Query;
  insert: (rows: Row | Row[]) => Query;
  update: (values: Row) => Query;
  eq: (col: string, val: unknown) => Query;
  neq: (col: string, val: unknown) => Query;
  in: (col: string, vals: unknown[]) => Query;
  not: (col: string, op: string, val: unknown) => Query;
  order: () => Query;
  limit: () => Query;
  maybeSingle: () => Promise<{ data: Row | null; error: unknown }>;
  single: () => Promise<{ data: Row | null; error: unknown }>;
}

export function createFakeDb(): FakeDb {
  const db: FakeDb = {
    tables: {},
    unique: {},
    signedUrls: [],
    from: (table) => query(db, table),
    storage: {
      from: (bucket) => ({
        createSignedUrl: async (path: string) => {
          const url = `https://signed.example/${bucket}/${path}`;
          db.signedUrls.push(url);
          return { data: { signedUrl: url } };
        },
      }),
    },
  };
  return db;
}

function query(db: FakeDb, table: string): Query {
  const filters: Filter[] = [];
  let mode: "select" | "insert" | "update" = "select";
  let payload: Row | Row[] | null = null;
  let returning = false;

  const rows = () => (db.tables[table] ??= []);
  const matching = () => rows().filter((r) => filters.every((f) => f(r)));

  const run = async (): Promise<{ data: unknown; error: unknown }> => {
    await Promise.resolve(); // yield, so concurrent callers interleave
    if (mode === "insert") {
      const incoming = Array.isArray(payload) ? payload : [payload as Row];
      for (const row of incoming) {
        for (const cols of db.unique[table] ?? []) {
          if (rows().some((r) => cols.every((c) => r[c] === row[c]))) {
            return { data: null, error: { code: "23505", message: "duplicate key" } };
          }
        }
      }
      rows().push(...incoming.map((r) => ({ ...r })));
      return { data: incoming, error: null };
    }
    if (mode === "update") {
      const hit = matching();
      for (const r of hit) Object.assign(r, payload);
      return { data: returning ? hit.map((r) => ({ ...r })) : null, error: null };
    }
    return { data: matching().map((r) => ({ ...r })), error: null };
  };

  const q: Query = {
    select: () => {
      if (mode !== "select") returning = true;
      return q;
    },
    insert: (r) => {
      mode = "insert";
      payload = r;
      return q;
    },
    update: (values) => {
      mode = "update";
      payload = values;
      return q;
    },
    eq: (col, val) => (filters.push((r) => r[col] === val), q),
    neq: (col, val) => (filters.push((r) => r[col] !== val), q),
    in: (col, vals) => (filters.push((r) => vals.includes(r[col])), q),
    not: (col, op, val) => (filters.push((r) => !(op === "is" && val === null ? r[col] == null : r[col] === val)), q),
    order: () => q,
    limit: () => q,
    maybeSingle: async () => {
      const { data, error } = await run();
      return { data: (data as Row[] | null)?.[0] ?? null, error };
    },
    single: async () => {
      const { data, error } = await run();
      return { data: (data as Row[] | null)?.[0] ?? null, error };
    },
    then: (resolve, reject) => run().then(resolve, reject),
  };
  return q;
}
