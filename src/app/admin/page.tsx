import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody } from "@/components/ui/card";
import { formatCurrency } from "@/lib/money";

export const metadata: Metadata = { title: "Admin overview" };

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const body = (
    <Card className={href ? "transition-colors hover:border-(--color-brand)" : undefined}>
      <CardBody>
        <p className="text-sm text-(--color-ink-muted)">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-(--color-ink)">{value}</p>
      </CardBody>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminOverviewPage() {
  // Every query below relies on RLS, not an app-level check: is_store_member()
  // (and therefore every "member" policy built on it -- stores, orders,
  // platform_billing) already returns true for a platform admin regardless
  // of which store is being read, and profiles/platform_feedback grant
  // admins the same blanket read directly. See 0009_functions_triggers.sql.
  const supabase = await createClient();

  const [
    { count: storeCount },
    { count: profileCount },
    { count: paidOrderCount },
    { data: paidOrders },
    { count: newConsultCount },
    { count: openFeedbackCount },
    { data: billing },
    { data: recentProfiles },
  ] = await Promise.all([
    supabase.from("stores").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid"),
    supabase.from("orders").select("total, currency").eq("payment_status", "paid"),
    supabase.from("consultation_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("platform_feedback").select("id", { count: "exact", head: true }).neq("status", "resolved"),
    supabase.from("platform_billing").select("billing_plan, is_founding_member"),
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at, stores!stores_owner_id_fkey(slug, name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const gmv = (paidOrders ?? []).reduce((sum, o) => sum + o.total, 0);
  const currency = paidOrders?.[0]?.currency ?? "GHS";
  const foundingCount = (billing ?? []).filter((b) => b.is_founding_member).length;
  const commissionCount = (billing ?? []).filter((b) => b.billing_plan === "commission").length;
  const subscriptionCount = (billing ?? []).filter((b) => b.billing_plan === "subscription").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-(--color-ink)">Overview</h1>
        <p className="text-sm text-(--color-ink-muted)">Everything happening across HASTECH Commerce.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Stores" value={String(storeCount ?? 0)} href="/admin/stores" />
        <StatCard label="Signed-up users" value={String(profileCount ?? 0)} />
        <StatCard label="Paid orders" value={String(paidOrderCount ?? 0)} />
        <StatCard label="Total sales (GMV)" value={formatCurrency(gmv, currency)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Founding members" value={`${foundingCount} / 10`} />
        <StatCard label="On commission plan" value={String(commissionCount)} />
        <StatCard label="On subscription plan" value={String(subscriptionCount)} />
        <StatCard
          label="New consultation requests"
          value={String(newConsultCount ?? 0)}
          href="/admin/consultations"
        />
      </div>

      {(openFeedbackCount ?? 0) > 0 && (
        <Card className="border-(--color-warning)">
          <CardBody>
            <Link href="/admin/feedback" className="text-sm font-medium text-(--color-ink) hover:underline">
              {openFeedbackCount} open feedback item{openFeedbackCount === 1 ? "" : "s"} waiting for a look →
            </Link>
          </CardBody>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-(--color-ink-muted)">
          Recent signups
        </h2>
        <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
          <table className="w-full text-sm">
            <thead className="border-b border-(--color-border) text-left text-(--color-ink-muted)">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-border)">
              {(recentProfiles ?? []).map((profile) => {
                const store = (profile.stores as unknown as { slug: string; name: string }[] | null)?.[0];
                return (
                  <tr key={profile.id}>
                    <td className="px-4 py-3 text-(--color-ink)">{profile.full_name ?? "—"}</td>
                    <td className="px-4 py-3 text-(--color-ink-muted)">{profile.email}</td>
                    <td className="px-4 py-3">
                      {store ? (
                        <Link href={`/store/${store.slug}`} className="text-(--color-brand) hover:underline">
                          {store.name}
                        </Link>
                      ) : (
                        <span className="text-(--color-ink-muted)">No store yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-(--color-ink-muted)">
                      {new Date(profile.created_at).toLocaleDateString("en-GB", {
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
    </div>
  );
}
