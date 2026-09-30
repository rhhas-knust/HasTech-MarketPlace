import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "All stores" };

export default async function AdminStoresPage() {
  const supabase = await createClient();
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, slug, status, published_at, created_at, profiles!stores_owner_id_fkey(full_name, email)")
    .order("created_at", { ascending: false });

  const storeIds = (stores ?? []).map((s) => s.id);
  const { data: billingRows } = storeIds.length
    ? await supabase
        .from("platform_billing")
        .select("store_id, billing_plan, is_founding_member, subscription_status")
        .in("store_id", storeIds)
    : { data: [] as { store_id: string; billing_plan: string; is_founding_member: boolean; subscription_status: string }[] };

  const billingByStore = new Map((billingRows ?? []).map((b) => [b.store_id, b]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-(--color-ink)">All stores</h1>
        <p className="text-sm text-(--color-ink-muted)">Every seller on the platform, newest first.</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
        <table className="w-full text-sm">
          <thead className="border-b border-(--color-border) text-left text-(--color-ink-muted)">
            <tr>
              <th className="px-4 py-3 font-medium">Store</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {(stores ?? []).map((store) => {
              const owner = store.profiles as unknown as { full_name: string | null; email: string } | null;
              const billing = billingByStore.get(store.id);
              const published = Boolean(store.published_at) && store.status === "active";
              return (
                <tr key={store.id}>
                  <td className="px-4 py-3">
                    <Link href={`/store/${store.slug}`} className="font-medium text-(--color-brand) hover:underline">
                      {store.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)">
                    {owner?.full_name ?? "—"}
                    <div className="text-xs text-(--color-ink-muted)">{owner?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={published ? "success" : "neutral"}>{published ? "Live" : "Not published"}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {billing?.is_founding_member ? (
                      <Badge tone="brand">Founding member</Badge>
                    ) : billing?.billing_plan === "subscription" ? (
                      <Badge tone="neutral">
                        Subscription{billing.subscription_status === "active" ? " (active)" : " (unpaid)"}
                      </Badge>
                    ) : (
                      <Badge tone="neutral">Commission</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-(--color-ink-muted)">
                    {new Date(store.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
