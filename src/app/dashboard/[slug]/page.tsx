import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  Circle,
  ExternalLink,
  Eye,
  MessageCircle,
  PackageX,
  Percent,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { getCurrentProfile, getCurrentUser, requireStoreAccess } from "@/lib/auth/session";
import {
  getAttentionCounts,
  getOverviewStats,
  getRecentActivity,
  getRecentOrders,
  getRevenueOverTime,
  getTopSellingProducts,
  getViewsOverTime,
  getWeeklyHighlights,
} from "@/lib/dashboard-data";
import { isPaymentProviderConfigured } from "@/lib/payments";
import { formatCurrency } from "@/lib/money";
import { FULFILMENT_STATUS_LABELS } from "@/lib/constants";
import { RevenueChart, ViewsChart } from "@/components/dashboard/charts";
import { CardHeading, InitialsAvatar, KpiTile, Meter, timeAgo } from "@/components/console/ui";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { WelcomeGift } from "@/components/dashboard/welcome-gift";
import { FoundingPartnerBanner } from "@/components/dashboard/founding-partner-banner";
import { getPlatformBilling } from "@/lib/payments/platform";
import { getAppUrl } from "@/lib/app-url";
import { cn } from "@/lib/cn";
import { publishStoreAction, unpublishStoreAction } from "./actions";

function greetingFor(date: Date) {
  const hour = Number(date.toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: "Africa/Accra" }));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function currentTime() {
  return new Date();
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Eye; tone: string }> = {
  product_view: { icon: Eye, tone: "bg-(--color-brand-subtle) text-(--color-brand)" },
  add_to_cart: { icon: ShoppingCart, tone: "bg-(--color-warning-subtle) text-(--color-warning)" },
  purchase: { icon: Wallet, tone: "bg-(--color-success-subtle) text-(--color-success)" },
};

export default async function StoreOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");
  const { store } = membership;
  const showWelcome = welcome === "1";

  const [
    user,
    profile,
    stats,
    weekly,
    attention,
    revenueSeries,
    viewsSeries,
    activity,
    recentOrders,
    topProducts,
    paymentConfigured,
    billing,
    appUrl,
  ] = await Promise.all([
    getCurrentUser(),
    getCurrentProfile(),
    getOverviewStats(store.id),
    getWeeklyHighlights(store.id),
    getAttentionCounts(store.id),
    getRevenueOverTime(store.id),
    getViewsOverTime(store.id),
    getRecentActivity(store.id, 8),
    getRecentOrders(store.id, 6),
    getTopSellingProducts(store.id, 5),
    isPaymentProviderConfigured(store.id),
    getPlatformBilling(store.id),
    getAppUrl(),
  ]);

  const now = currentTime();
  const nowMs = now.getTime();
  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const conversionRate = stats.totalViews > 0 ? (stats.purchaseCount / stats.totalViews) * 100 : 0;
  const isPublished = Boolean(store.published_at);
  const storeUrl = `${appUrl}/store/${store.slug}`;
  const shareText = `${store.name} is online. Order and pay with MoMo or card: ${storeUrl}`;

  const checklist = [
    { done: stats.productsCount > 0, label: "Add your first product", href: `/dashboard/${slug}/products/new` },
    { done: paymentConfigured, label: "Connect Paystack to get paid", href: `/dashboard/${slug}/settings/payments` },
    { done: isPublished, label: "Publish your store", href: undefined },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const topSales = topProducts[0]?.purchase_count ?? 0;

  return (
    <div className="space-y-6">
      {showWelcome && (
        <WelcomeGift
          storeName={store.name}
          storeUrl={storeUrl}
          foundingUntil={billing?.isFoundingMember ? billing.foundingMemberUntil : null}
          isPublished={isPublished}
        />
      )}

      {!showWelcome && billing?.isFoundingMember && billing.foundingMemberUntil && (
        <FoundingPartnerBanner
          storeSlug={slug}
          foundingUntil={billing.foundingMemberUntil}
          signInKey={user?.last_sign_in_at ?? "session"}
        />
      )}

      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-(--color-border) pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-(--color-ink)">
            {greetingFor(now)}, {firstName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-(--color-ink-muted)">
            <span
              aria-hidden
              className={cn("h-2 w-2 rounded-full", isPublished ? "bg-(--color-success)" : "bg-(--color-warning)")}
            />
            <span className="truncate">
              {store.name} is {isPublished ? "live" : "not published yet"}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <PublishToggle
              published={isPublished}
              onPublish={publishStoreAction.bind(null, slug)}
              onUnpublish={unpublishStoreAction.bind(null, slug)}
            />
            <a
              href={`/store/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
            >
              <ExternalLink className="h-4 w-4" aria-hidden /> View store
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            {isPublished && (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--color-border-strong) px-3 text-sm font-medium text-(--color-ink) hover:bg-(--color-surface-subtle)"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> Share on WhatsApp
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-(--color-ink-muted)">Total sales</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-(--color-ink)">
            {formatCurrency(stats.totalRevenue, store.currency)}
          </p>
          <p className="mt-1 text-sm text-(--color-ink-muted)">
            {weekly.revenueThisWeek > 0
              ? `+${formatCurrency(weekly.revenueThisWeek, store.currency)} this week`
              : "No sales yet this week"}
          </p>
        </div>
      </header>

      {/* Setup progress: only until everything is done */}
      {doneCount < checklist.length && (
        <section className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardHeading title="Finish setting up your store" description={`${doneCount} of ${checklist.length} steps done`} />
          </div>
          <div className="mt-4">
            <Meter value={doneCount} max={checklist.length} label="Store setup progress" />
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {checklist.map((item) => {
              const content = (
                <>
                  {item.done ? (
                    <CircleCheck className="h-5 w-5 shrink-0 text-(--color-success)" aria-label="Done" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-(--color-ink-muted)" aria-label="Not done" />
                  )}
                  <span className={cn("text-sm", item.done ? "text-(--color-ink-muted) line-through" : "font-medium text-(--color-ink)")}>
                    {item.label}
                  </span>
                  {!item.done && item.href && <ArrowRight className="ml-auto h-4 w-4 text-(--color-brand)" aria-hidden />}
                </>
              );
              return (
                <li key={item.label}>
                  {item.href && !item.done ? (
                    <Link
                      href={item.href}
                      className="flex h-full items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface-subtle) p-4 transition-colors hover:border-(--color-border-strong)"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex h-full items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface-subtle) p-4">
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          label="Orders"
          value={String(stats.totalOrdersCount)}
          delta={{ value: weekly.ordersThisWeek, period: "this week" }}
          icon={<ShoppingBag className="h-5 w-5" />}
          href={`/dashboard/${slug}/orders`}
        />
        <KpiTile
          label="Customers"
          value={String(stats.customersCount)}
          delta={{ value: weekly.customersThisWeek, period: "this week" }}
          icon={<Users className="h-5 w-5" />}
          href={`/dashboard/${slug}/customers`}
        />
        <KpiTile
          label="Store views"
          value={String(stats.viewsThisWeek)}
          delta={{ value: stats.viewsToday, period: "today" }}
          icon={<Eye className="h-5 w-5" />}
          href={`/dashboard/${slug}/analytics`}
        />
        <KpiTile
          label="View → purchase"
          value={`${conversionRate.toFixed(1)}%`}
          icon={<Percent className="h-5 w-5" />}
          href={`/dashboard/${slug}/analytics`}
        />
      </div>

      {/* Needs attention + top sellers */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <CardHeading title="Needs your attention" />
          <div className="mt-4 space-y-3">
            <Link
              href={`/dashboard/${slug}/orders?view=todo`}
              className="group flex items-center gap-4 rounded-lg border border-(--color-border) p-4 transition-colors hover:border-(--color-brand)/40 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--color-brand-subtle) text-(--color-brand)">
                <Truck className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-2xl font-semibold text-(--color-ink)">{attention.ordersToFulfil}</span>
                <span className="text-sm text-(--color-ink-muted)">paid orders to fulfil</span>
              </span>
              <ArrowRight className="h-4 w-4 text-(--color-ink-muted) transition-transform" />
            </Link>
            <Link
              href={`/dashboard/${slug}/products?status=low_stock`}
              className="group flex items-center gap-4 rounded-lg border border-(--color-border) p-4 transition-colors hover:border-(--color-brand)/40 hover:shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-(--color-warning-subtle) text-(--color-warning)">
                <PackageX className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-2xl font-semibold text-(--color-ink)">{attention.lowStock + attention.outOfStock}</span>
                <span className="text-sm text-(--color-ink-muted)">
                  products low or out of stock
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-(--color-ink-muted) transition-transform" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 lg:col-span-2">
          <CardHeading title="Best sellers" description="Your products ranked by sales." />
          {topProducts.length === 0 ? (
            <p className="mt-6 rounded-lg bg-(--color-surface-subtle) px-4 py-8 text-center text-sm text-(--color-ink-muted)">
              Add a product and your best sellers will show up here.
            </p>
          ) : (
            <ol className="mt-5 space-y-4">
              {topProducts.map((product, i) => (
                <li key={product.id}>
                  <div className="flex items-center gap-3">
                    <span className="w-5 tabular-nums text-sm text-(--color-ink-muted)">{i + 1}</span>
                    <Link
                      href={`/dashboard/${slug}/products/${product.id}`}
                      className="flex-1 truncate text-sm font-medium text-(--color-ink) hover:text-(--color-brand)"
                    >
                      {product.name}
                    </Link>
                    <span className="text-xs text-(--color-ink-muted)">{product.view_count} views</span>
                    <span className="w-16 text-right tabular-nums text-sm font-semibold text-(--color-ink) tabular-nums">
                      {product.purchase_count} sold
                    </span>
                  </div>
                  <div className="ml-8 mt-2 h-1.5 overflow-hidden rounded-full bg-(--color-brand-subtle)">
                    <div
                      className="h-full rounded-full bg-(--color-brand)"
                      style={{ width: `${topSales > 0 ? (product.purchase_count / topSales) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <CardHeading title="Revenue" description="Last 30 days." />
          <div className="mt-4">
            <RevenueChart data={revenueSeries} currency={store.currency} />
          </div>
        </div>
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <CardHeading title="Product views" description="Last 30 days." />
          <div className="mt-4">
            <ViewsChart data={viewsSeries} />
          </div>
        </div>
      </div>

      {/* Recent orders + live activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <div className="flex items-center justify-between gap-3">
            <CardHeading title="Recent orders" />
            <Link href={`/dashboard/${slug}/orders`} className="text-sm font-medium text-(--color-brand) hover:underline">
              See all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-6 rounded-lg bg-(--color-surface-subtle) px-4 py-8 text-center text-sm text-(--color-ink-muted)">
              No orders yet. Share your store link to get your first one.
            </p>
          ) : (
            <ul className="mt-4 space-y-1">
              {recentOrders.map((order) => {
                const customer = order.customers as unknown as { first_name: string | null; last_name: string | null; email: string | null } | null;
                const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || customer?.email || "Customer";
                return (
                  <li key={order.id}>
                    <Link
                      href={`/dashboard/${slug}/orders/${order.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-(--color-surface-subtle)"
                    >
                      <InitialsAvatar name={name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-(--color-ink)">{name}</p>
                        <p className="text-xs text-(--color-ink-muted)">
                          {order.order_number} · {timeAgo(order.created_at, nowMs)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="tabular-nums text-sm font-semibold text-(--color-ink) tabular-nums">
                          {formatCurrency(order.total, order.currency)}
                        </p>
                        <p
                          className={cn(
                            "text-xs",
                            order.payment_status === "paid" ? "text-(--color-success)" : "text-(--color-ink-muted)",
                          )}
                        >
                          {order.payment_status === "paid"
                            ? FULFILMENT_STATUS_LABELS[order.fulfilment_status]
                            : "Awaiting payment"}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <CardHeading title="Live activity" description="What shoppers are doing in your store." />
          {activity.length === 0 ? (
            <p className="mt-6 rounded-lg bg-(--color-surface-subtle) px-4 py-8 text-center text-sm text-(--color-ink-muted)">
              Once customers start visiting, you&apos;ll see it here.
            </p>
          ) : (
            <ul className="mt-4 space-y-1">
              {activity.map((item) => {
                const meta = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.product_view;
                const Icon = meta.icon;
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
                    <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.tone)}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-(--color-ink)">{item.description}</span>
                    <span className="shrink-0 text-xs text-(--color-ink-muted)">{timeAgo(item.createdAt, nowMs)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
