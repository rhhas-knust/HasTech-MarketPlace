import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ShoppingBag } from "lucide-react";
import { requireStoreAccess } from "@/lib/auth/session";
import { getStoreOrders } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/money";
import { FULFILMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const membership = await requireStoreAccess(slug);
  if (!membership) redirect("/dashboard");

  const orders = await getStoreOrders(membership.store.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-8 w-8" />}
        title="No orders yet"
        description="Orders will show up here as soon as customers start buying."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-(--color-ink)">Orders</h1>
      <div className="overflow-x-auto rounded-xl border border-(--color-border) bg-(--color-surface)">
        <table className="w-full text-sm">
          <thead className="border-b border-(--color-border) text-left text-(--color-ink-muted)">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {orders.map((order) => {
              const customer = order.customers as unknown as { first_name: string | null; last_name: string | null; email: string | null } | null;
              return (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/${slug}/orders/${order.id}`} className="font-medium text-(--color-brand) hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)">
                    {[customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || customer?.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-(--color-ink)">{formatCurrency(order.total, order.currency)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={order.payment_status === "paid" ? "success" : order.payment_status === "failed" ? "danger" : "warning"}>
                      {PAYMENT_STATUS_LABELS[order.payment_status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone="brand">{FULFILMENT_STATUS_LABELS[order.fulfilment_status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-(--color-ink-muted)">
                    {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
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
