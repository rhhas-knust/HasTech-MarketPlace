import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Crown, Inbox, MessageSquareWarning, Receipt, Store, Trophy, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { CardHeading, InitialsAvatar, KpiTile, Meter, timeAgo } from "@/components/console/ui";
import { formatCurrency } from "@/lib/money";
import { FOUNDING_MEMBER_LIMIT } from "@/lib/constants";

export const metadata: Metadata = { title: "Admin overview" };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function greetingFor(date: Date) {
  const hour = Number(date.toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Accra" }));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function currentTime() {
  return new Date();
}

export default async function AdminOverviewPage() {
  // Every query below relies on RLS, not an app-level check: is_store_member()
  // (and therefore every "member" policy built on it -- stores, orders,
  // platform_billing) already returns true for a platform admin regardless
  // of which store is being read, and profiles/platform_feedback grant
  // admins the same blanket read directly. See 0009_functions_triggers.sql.
  const supabase = await createClient();
  const now = currentTime();
  const weekAgo = new Date(now.getTime() - WEEK_MS).toISOString();

  const [
    profile,
    { data: stores },
    { count: profileCount },
    { count: newProfilesThisWeek },
    { data: paidOrders },
    { count: newConsultCount },
    { count: openFeedbackCount },
    { data: billing },
    { data: recentProfiles },
  ] = await Promise.all([
    getCurrentProfile(),
    supabase.from("stores").select("id, name, slug, status, published_at, created_at"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("orders").select("store_id, total, currency, created_at").eq("payment_status", "paid"),
    supabase.from("consultation_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("platform_feedback").select("id", { count: "exact", head: true }).neq("status", "resolved"),
    supabase.from("platform_billing").select("billing_plan, is_founding_member"),
    supabase
      .from("profiles")
      .select("id, full_name, email, created_at, stores!stores_owner_id_fkey(slug, name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const allStores = stores ?? [];
  const orders = paidOrders ?? [];
  const storesThisWeek = allStores.filter((s) => s.created_at >= weekAgo).length;
  const liveStores = allStores.filter((s) => s.published_at && s.status === "active").length;
  const ordersThisWeek = orders.filter((o) => o.created_at >= weekAgo);
  const gmv = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const gmvThisWeek = ordersThisWeek.reduce((sum, o) => sum + Number(o.total), 0);
  const currency = orders[0]?.currency ?? "GHS";

  const foundingCount = (billing ?? []).filter((b) => b.is_founding_member).length;
  const commissionCount = (billing ?? []).filter((b) => b.billing_plan === "commission").length;
  const subscriptionCount = (billing ?? []).filter((b) => b.billing_plan === "subscription").length;

  const salesByStore = new Map<string, number>();
  for (const o of orders) salesByStore.set(o.store_id, (salesByStore.get(o.store_id) ?? 0) + Number(o.total));
  const storeById = new Map(allStores.map((s) => [s.id, s]));
  const topStores = [...salesByStore.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, total]) => ({ store: storeById.get(id), total }))
    .filter((row) => row.store);
  const topTotal = topStores[0]?.total ?? 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const nowMs = now.getTime();

  return (
    <div className="space-y-6">
      {/* Welcome + hero figure */}
      <section className="relative overflow-hidden rounded-xl bg-(--color-brand) p-6 text-white shadow-raised sm:p-8">
        <div aria-hidden className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-white/25 backdrop-blur">
              <Crown className="h-3.5 w-3.5" /> Owner console
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
              {greetingFor(now)}, {firstName} 👋
            </h1>
            <p className="mt-1 text-sm text-white/80">Here&apos;s everything happening across HASTECH Commerce.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">Total sales on the platform</p>
            <p className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">
              {formatCurrency(gmv, currency)}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {gmvThisWeek > 0 ? `+${formatCurrency(gmvThisWeek, currency)} this week` : "No sales yet this week"}
            </p>
          </div>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Stores"
          value={String(allStores.length)}
          delta={{ value: storesThisWeek, period: "this week" }}
          icon={<Store className="h-5 w-5" />}
          href="/admin/stores"
        />
        <KpiTile
          label="Live stores"
          value={String(liveStores)}
          icon={<Trophy className="h-5 w-5" />}
          href="/admin/stores"
        />
        <KpiTile
          label="Signed-up users"
          value={String(profileCount ?? 0)}
          delta={{ value: newProfilesThisWeek ?? 0, period: "this week" }}
          icon={<Users className="h-5 w-5" />}
        />
        <KpiTile
          label="Paid orders"
          value={String(orders.length)}
          delta={{ value: ordersThisWeek.length, period: "this week" }}
          icon={<Receipt className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Founding members meter */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <p className="text-sm font-medium text-(--color-ink-muted)">Founding members</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-(--color-ink)">
            {foundingCount}
            <span className="text-lg font-medium text-(--color-ink-muted)"> / {FOUNDING_MEMBER_LIMIT}</span>
          </p>
          <div className="mt-4">
            <Meter value={foundingCount} max={FOUNDING_MEMBER_LIMIT} label="Founding member spots used" />
          </div>
          <p className="mt-3 text-sm text-(--color-ink-muted)">
            {foundingCount >= FOUNDING_MEMBER_LIMIT
              ? "All founding spots are taken."
              : `${FOUNDING_MEMBER_LIMIT - foundingCount} free spots left for new sellers.`}
          </p>
        </div>

        {/* Plans */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <p className="text-sm font-medium text-(--color-ink-muted)">Billing plans</p>
          <ul className="mt-4 space-y-3">
            {[
              { label: "Commission (5% per sale)", value: commissionCount },
              { label: "Monthly subscription", value: subscriptionCount },
              { label: "Fees waived (founding)", value: foundingCount },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between rounded-lg bg-(--color-surface-subtle) px-4 py-3">
                <span className="text-sm text-(--color-ink)">{row.label}</span>
                <span className="tabular-nums text-lg font-semibold text-(--color-ink) tabular-nums">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Inbox */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <p className="text-sm font-medium text-(--color-ink-muted)">Needs your attention</p>
          <div className="mt-4 space-y-3">
            <Link
              href="/admin/consultations"
              className="group flex items-center gap-4 rounded-lg border border-(--color-border) p-4 transition-all hover:border-(--color-brand)/40 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--color-brand-subtle) text-(--color-brand)">
                <Inbox className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-2xl font-semibold text-(--color-ink)">{newConsultCount ?? 0}</span>
                <span className="text-sm text-(--color-ink-muted)">new consultation requests</span>
              </span>
              <ArrowRight className="h-4 w-4 text-(--color-ink-muted) transition-transform" />
            </Link>
            <Link
              href="/admin/feedback"
              className="group flex items-center gap-4 rounded-lg border border-(--color-border) p-4 transition-all hover:border-(--color-brand)/40 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--color-warning-subtle) text-(--color-warning)">
                <MessageSquareWarning className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-2xl font-semibold text-(--color-ink)">{openFeedbackCount ?? 0}</span>
                <span className="text-sm text-(--color-ink-muted)">open feedback items</span>
              </span>
              <ArrowRight className="h-4 w-4 text-(--color-ink-muted) transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top stores */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <CardHeading title="Top stores" description="Ranked by total paid sales." />
          {topStores.length === 0 ? (
            <p className="mt-6 rounded-lg bg-(--color-surface-subtle) px-4 py-8 text-center text-sm text-(--color-ink-muted)">
              No paid orders yet. The first sale will show up here.
            </p>
          ) : (
            <ol className="mt-5 space-y-4">
              {topStores.map(({ store, total }, i) => (
                <li key={store!.id}>
                  <div className="flex items-center gap-3">
                    <span className="w-5 tabular-nums text-sm text-(--color-ink-muted)">{i + 1}</span>
                    <Link href={`/store/${store!.slug}`} className="flex-1 truncate text-sm font-medium text-(--color-ink) hover:text-(--color-brand)">
                      {store!.name}
                    </Link>
                    <span className="tabular-nums text-sm font-semibold text-(--color-ink) tabular-nums">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                  <div className="ml-8 mt-2 h-1.5 overflow-hidden rounded-full bg-(--color-brand-subtle)">
                    <div className="h-full rounded-full bg-(--color-brand)" style={{ width: `${(total / topTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Recent signups */}
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <CardHeading title="Recent signups" description="The newest people on the platform." />
          <ul className="mt-5 space-y-2">
            {(recentProfiles ?? []).map((p) => {
              const store = (p.stores as unknown as { slug: string; name: string }[] | null)?.[0];
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-(--color-surface-subtle)">
                  <InitialsAvatar name={p.full_name ?? p.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-(--color-ink)">{p.full_name ?? "—"}</p>
                    <p className="truncate text-xs text-(--color-ink-muted)">{p.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {store ? (
                      <Link
                        href={`/store/${store.slug}`}
                        className="inline-block max-w-32 truncate rounded-md bg-(--color-brand-subtle) px-2.5 py-0.5 text-xs font-medium text-(--color-brand)"
                      >
                        {store.name}
                      </Link>
                    ) : (
                      <span className="rounded-md bg-(--color-surface-subtle) px-2.5 py-0.5 text-xs text-(--color-ink-muted)">
                        No store yet
                      </span>
                    )}
                    <p className="mt-1 text-xs text-(--color-ink-muted)">{timeAgo(p.created_at, nowMs)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
