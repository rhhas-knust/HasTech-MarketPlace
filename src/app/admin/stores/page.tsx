import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader, FilterTabs, InitialsAvatar, formatShortDate } from "@/components/console/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "All stores" };

type Filter = "all" | "live" | "draft" | "founding";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Not published" },
  { value: "founding", label: "Founding" },
];

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q = "", filter: rawFilter } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.value === rawFilter) ? (rawFilter as Filter) : "all";

  const supabase = await createClient();
  const [{ data: stores }, { data: billingRows }] = await Promise.all([
    supabase
      .from("stores")
      .select("id, name, slug, status, business_type, published_at, created_at, profiles!stores_owner_id_fkey(full_name, email)")
      .order("created_at", { ascending: false }),
    supabase.from("platform_billing").select("store_id, billing_plan, is_founding_member, subscription_status"),
  ]);

  const billingByStore = new Map((billingRows ?? []).map((b) => [b.store_id, b]));
  const rows = (stores ?? []).map((store) => ({
    ...store,
    owner: store.profiles as unknown as { full_name: string | null; email: string } | null,
    billing: billingByStore.get(store.id),
    live: Boolean(store.published_at) && store.status === "active",
  }));

  const counts: Record<Filter, number> = {
    all: rows.length,
    live: rows.filter((r) => r.live).length,
    draft: rows.filter((r) => !r.live).length,
    founding: rows.filter((r) => r.billing?.is_founding_member).length,
  };

  const needle = q.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (filter === "live" && !r.live) return false;
    if (filter === "draft" && r.live) return false;
    if (filter === "founding" && !r.billing?.is_founding_member) return false;
    if (!needle) return true;
    return [r.name, r.slug, r.owner?.full_name ?? "", r.owner?.email ?? ""].some((v) => v.toLowerCase().includes(needle));
  });

  const hrefFor = (next: Filter) => {
    const params = new URLSearchParams();
    if (next !== "all") params.set("filter", next);
    if (q) params.set("q", q);
    const qs = params.toString();
    return qs ? `/admin/stores?${qs}` : "/admin/stores";
  };

  return (
    <div className="space-y-6">
      <PageHeader title="All stores">
        <form action="/admin/stores" className="w-full sm:w-72">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <label className="flex items-center gap-2 rounded-md border border-(--color-border-strong) bg-(--color-surface) px-4 py-2.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-brand)">
            <Search className="h-4 w-4 text-(--color-ink-muted)" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search stores or owners"
              className="w-full bg-transparent text-sm text-(--color-ink) outline-none placeholder:text-(--color-ink-muted)"
              aria-label="Search stores or owners"
            />
          </label>
        </form>
      </PageHeader>

      <FilterTabs
        tabs={FILTERS.map((f) => ({ href: hrefFor(f.value), label: f.label, count: counts[f.value], active: filter === f.value }))}
      />

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-(--color-border) bg-(--color-surface)/60 px-6 py-14 text-center text-sm text-(--color-ink-muted)">
          No stores match{needle ? ` "${q}"` : " this filter"}.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-(--color-surface-subtle)/70 text-left text-xs font-medium text-(--color-ink-muted)">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Store</th>
                <th className="px-5 py-3.5 font-semibold">Owner</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold">Plan</th>
                <th className="px-5 py-3.5 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)/70">
              {visible.map((store) => (
                <tr key={store.id} className="transition-colors hover:bg-(--color-surface-subtle)/60">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={store.name} />
                      <div className="min-w-0">
                        <Link
                          href={`/store/${store.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-semibold text-(--color-ink) hover:text-(--color-brand)"
                        >
                          {store.name} <ExternalLink className="h-3 w-3 opacity-50" />
                        </Link>
                        <p className="tabular-nums text-xs text-(--color-ink-muted)">/store/{store.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-(--color-ink)">{store.owner?.full_name ?? "No name"}</p>
                    <p className="text-xs text-(--color-ink-muted)">{store.owner?.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
                        store.live
                          ? "bg-(--color-success-subtle) text-(--color-success)"
                          : "bg-(--color-surface-subtle) text-(--color-ink-muted)",
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", store.live ? "bg-(--color-success)" : "bg-(--color-ink-muted)")} />
                      {store.live ? "Live" : "Not published"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {store.billing?.is_founding_member ? (
                      <Badge tone="brand">Founding member</Badge>
                    ) : store.billing?.billing_plan === "subscription" ? (
                      <Badge tone={store.billing.subscription_status === "active" ? "success" : "warning"}>
                        Subscription{store.billing.subscription_status === "active" ? "" : " (unpaid)"}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Commission 5%</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-(--color-ink-muted)">{formatShortDate(store.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
