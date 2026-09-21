import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { requireStoreAccess } from "@/lib/auth/session";
import { getOverviewStats, getRevenueOverTime, getTopViewedProducts, getViewsOverTime } from "@/lib/dashboard-data";
import { RevenueChart, ViewsChart } from "@/components/dashboard/charts";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const [stats, revenueSeries, viewsSeries, topProducts] = await Promise.all([
    getOverviewStats(membership.store.id),
    getRevenueOverTime(membership.store.id),
    getViewsOverTime(membership.store.id),
    getTopViewedProducts(membership.store.id, 8),
  ]);

  const viewToCartRate = stats.totalViews > 0 ? (stats.addToCartCount / stats.totalViews) * 100 : 0;
  const cartToPurchaseRate = stats.addToCartCount > 0 ? (stats.purchaseCount / stats.addToCartCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-(--color-ink)">Analytics</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total views" value={String(stats.totalViews)} />
        <StatCard label="Added to cart" value={String(stats.addToCartCount)} />
        <StatCard label="View → cart rate" value={`${viewToCartRate.toFixed(1)}%`} />
        <StatCard label="Cart → purchase rate" value={`${cartToPurchaseRate.toFixed(1)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue, last 30 days</CardTitle>
          </CardHeader>
          <CardBody>
            <RevenueChart data={revenueSeries} currency={membership.store.currency} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Views, last 30 days</CardTitle>
          </CardHeader>
          <CardBody>
            <ViewsChart data={viewsSeries} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top viewed products</CardTitle>
        </CardHeader>
        <CardBody>
          {topProducts.length === 0 ? (
            <EmptyState title="No product views yet" />
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-(--color-ink-muted)">
                <tr>
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium">Views</th>
                  <th className="pb-2 font-medium">Added to cart</th>
                  <th className="pb-2 font-medium">Purchased</th>
                  <th className="pb-2 font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border)">
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="py-2">
                      <Link href={`/dashboard/${slug}/products/${product.id}`} className="text-(--color-brand) hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-2 text-(--color-ink)">{product.viewCount}</td>
                    <td className="py-2 text-(--color-ink)">{product.addToCartCount}</td>
                    <td className="py-2 text-(--color-ink)">{product.purchaseCount}</td>
                    <td className="py-2 text-(--color-ink)">
                      {product.viewCount > 0 ? ((product.purchaseCount / product.viewCount) * 100).toFixed(1) : "0.0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
