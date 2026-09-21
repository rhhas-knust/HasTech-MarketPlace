import { redirect } from "next/navigation";
import Link from "next/link";
import { Eye, ShoppingBag, Users, Wallet, Package, CircleCheck, Circle } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getOverviewStats, getRecentActivity, getRevenueOverTime, getViewsOverTime } from "@/lib/dashboard-data";
import { isPaymentProviderConfigured } from "@/lib/payments";
import { formatCurrency } from "@/lib/money";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart, ViewsChart } from "@/components/dashboard/charts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PublishToggle } from "@/components/dashboard/publish-toggle";
import { publishStoreAction, unpublishStoreAction } from "./actions";

export default async function StoreOverviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");
  const { store } = membership;

  const [stats, revenueSeries, viewsSeries, activity, paymentConfigured] = await Promise.all([
    getOverviewStats(store.id),
    getRevenueOverTime(store.id),
    getViewsOverTime(store.id),
    getRecentActivity(store.id, 10),
    isPaymentProviderConfigured(store.id),
  ]);

  const conversionRate = stats.totalViews > 0 ? (stats.purchaseCount / stats.totalViews) * 100 : 0;
  const isPublished = Boolean(store.published_at);

  const checklist = [
    { done: stats.productsCount > 0, label: "Add your first product", href: `/dashboard/${slug}/products/new` },
    { done: paymentConfigured, label: "Connect Paystack", href: `/dashboard/${slug}/settings/payments` },
    { done: isPublished, label: "Publish your store", href: undefined },
  ];
  const incomplete = checklist.filter((c) => !c.done);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-(--color-ink)">Overview</h1>
          <p className="text-sm text-(--color-ink-muted)">{store.name}</p>
        </div>
        <PublishToggle
          published={isPublished}
          onPublish={publishStoreAction.bind(null, slug)}
          onUnpublish={unpublishStoreAction.bind(null, slug)}
        />
      </div>

      {incomplete.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Finish setting up your store</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done ? (
                    <CircleCheck className="h-4 w-4 text-(--color-success)" />
                  ) : (
                    <Circle className="h-4 w-4 text-(--color-ink-muted)" />
                  )}
                  {item.href && !item.done ? (
                    <Link href={item.href} className="text-(--color-brand) hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={item.done ? "text-(--color-ink-muted) line-through" : "text-(--color-ink)"}>
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatCurrency(stats.totalRevenue, store.currency)}
          hint={`${stats.paidOrdersCount} paid orders`}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatCard
          label="Orders"
          value={String(stats.totalOrdersCount)}
          icon={<ShoppingBag className="h-4 w-4" />}
        />
        <StatCard label="Products" value={String(stats.productsCount)} icon={<Package className="h-4 w-4" />} />
        <StatCard label="Customers" value={String(stats.customersCount)} icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Views today" value={String(stats.viewsToday)} icon={<Eye className="h-4 w-4" />} />
        <StatCard label="Views this week" value={String(stats.viewsThisWeek)} />
        <StatCard label="Views this month" value={String(stats.viewsThisMonth)} />
        <StatCard label="View → purchase" value={`${conversionRate.toFixed(1)}%`} hint="of all-time views" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue, last 30 days</CardTitle>
          </CardHeader>
          <CardBody>
            <RevenueChart data={revenueSeries} currency={store.currency} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Product views, last 30 days</CardTitle>
          </CardHeader>
          <CardBody>
            <ViewsChart data={viewsSeries} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardBody>
          {activity.length === 0 ? (
            <EmptyState title="No activity yet" description="Once customers start visiting, you'll see it here." />
          ) : (
            <ul className="divide-y divide-(--color-border)">
              {activity.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-(--color-ink)">{item.description}</span>
                  <span className="shrink-0 text-(--color-ink-muted)">
                    {new Date(item.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
